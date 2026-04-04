package com.web.service;

import com.web.dto.task.CreateTaskRequest;
import com.web.dto.task.TaskHistoryResponse;
import com.web.dto.task.TaskResponse;
import com.web.dto.task.UpdateTaskStatusRequest;
import com.web.entity.Project;
import com.web.entity.ProjectMember;
import com.web.entity.Task;
import com.web.entity.TaskHistory;
import com.web.entity.User;
import com.web.repository.CommentRepository;
import com.web.repository.ProjectMemberRepository;
import com.web.repository.ProjectRepository;
import com.web.repository.TaskHistoryRepository;
import com.web.repository.TaskRepository;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private CommentRepository commentRepository;

    public TaskResponse createTask(Integer projectId, CreateTaskRequest req, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + projectId));

        if (!isOwner(project, requesterEmail)) {
            throw new AccessDeniedException("Ban khong co quyen tao task trong project nay");
        }

        User reporter = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + requesterEmail));

        String assigneeEmail = req.getAssigneeEmail().trim();
        User assignee = userRepository.findByEmail(assigneeEmail)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user voi email: " + assigneeEmail));

        if (!isOwner(project, assignee.getEmail()) && !isActiveMember(project.getId(), assignee.getId())) {
            throw new IllegalStateException("Nguoi duoc giao khong la thanh vien cua project");
        }

        Task task = new Task();
        task.setTitle(req.getTitle().trim());
        task.setDescription(req.getDescription());
        if (req.getPriority() != null && !req.getPriority().trim().isEmpty()) {
            task.setPriority(req.getPriority().trim());
        }
        task.setEstimatedHours(req.getEstimatedHours());
        task.setDueDate(req.getDueDate());
        task.setProject(project);
        task.setAssignee(assignee);
        task.setReporter(reporter);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        Task saved = taskRepository.save(task);
        return toResponse(saved);
    }

    public List<TaskResponse> listMyTasks(Integer projectId, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + projectId));

        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + requesterEmail));

        if (!isOwner(project, requesterEmail) && !isActiveMember(projectId, user.getId())) {
            throw new AccessDeniedException("Ban khong co quyen xem task trong project nay");
        }

        return taskRepository.findByProjectIdAndAssigneeId(projectId, user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TaskHistoryResponse> listTaskHistories(Integer projectId, Integer taskId, String requesterEmail) {
        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay task id=" + taskId));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + requesterEmail));

        if (!canAccessTask(task, requesterEmail, requester.getId())) {
            throw new AccessDeniedException("Ban khong co quyen xem lich su task nay");
        }

        return taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId)
                .stream()
                .map(this::toTaskHistoryResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse updateStatus(Integer projectId, Integer taskId, UpdateTaskStatusRequest req,
            String requesterEmail) {
        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay task id=" + taskId));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + requesterEmail));

        if (task.getAssignee() == null || task.getAssignee().getId() == null
                || !task.getAssignee().getId().equals(requester.getId())) {
            throw new AccessDeniedException("Ban chi co the cap nhat trang thai task duoc giao cho minh");
        }

        if (!isOwner(task.getProject(), requesterEmail) && !isActiveMember(projectId, requester.getId())) {
            throw new AccessDeniedException("Ban khong con la thanh vien cua project nay");
        }

        String newStatus = req.getStatus().trim();
        String oldStatus = task.getStatus();
        boolean statusChanged = oldStatus == null || !oldStatus.equalsIgnoreCase(newStatus);
        LocalDateTime now = LocalDateTime.now();
        if (statusChanged) {
            task.setStatus(newStatus);
        }
        task.setUpdatedAt(now);
        if (task.getStartedAt() == null && "IN_PROGRESS".equalsIgnoreCase(newStatus)) {
            task.setStartedAt(now);
        }
        if ("DONE".equalsIgnoreCase(newStatus) || "COMPLETED".equalsIgnoreCase(newStatus)) {
            task.setCompletedAt(now);
        }

        Task saved = taskRepository.save(task);
        if (statusChanged) {
            createTaskHistory(saved, requester, oldStatus, newStatus, now);
        }
        return toResponse(saved);
    }

    @Transactional
    public void deleteTask(Integer projectId, Integer taskId, String requesterEmail) {
        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay task id=" + taskId));

        if (!isOwner(task.getProject(), requesterEmail)) {
            throw new AccessDeniedException("Ban khong co quyen xoa task trong project nay");
        }

        try {
            commentRepository.clearTaskByTaskId(taskId);
            taskHistoryRepository.clearTaskByTaskId(taskId);
            taskRepository.delete(task);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Khong the xoa task dang duoc tham chieu");
        }
    }

    private boolean isOwner(Project project, String email) {
        return project != null
                && project.getOwner() != null
                && project.getOwner().getEmail() != null
                && project.getOwner().getEmail().equalsIgnoreCase(email);
    }

    private boolean isActiveMember(Integer projectId, Long userId) {
        Optional<ProjectMember> pmOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);
        return pmOpt.isPresent() && pmOpt.get().getLeftAt() == null;
    }

    private boolean canAccessTask(Task task, String requesterEmail, Long requesterId) {
        return isOwner(task.getProject(), requesterEmail) || isAssignee(task, requesterId);
    }

    private boolean isAssignee(Task task, Long userId) {
        return task != null
                && task.getAssignee() != null
                && task.getAssignee().getId() != null
                && task.getAssignee().getId().equals(userId);
    }

    private void createTaskHistory(Task task, User user, String oldStatus, String newStatus, LocalDateTime changedAt) {
        TaskHistory history = new TaskHistory();
        history.setTask(task);
        history.setUser(user);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setProgressAtThatTime(task.getProgress());
        history.setChangedAt(changedAt);
        taskHistoryRepository.save(history);
    }

    private TaskResponse toResponse(Task task) {
        TaskResponse res = new TaskResponse();
        res.setId(task.getId());
        if (task.getProject() != null) {
            res.setProjectId(task.getProject().getId());
        }
        res.setTitle(task.getTitle());
        res.setDescription(task.getDescription());
        res.setStatus(task.getStatus());
        res.setPriority(task.getPriority());
        res.setProgress(task.getProgress());
        res.setEstimatedHours(task.getEstimatedHours());
        res.setActualHours(task.getActualHours());
        res.setStartedAt(task.getStartedAt());
        res.setCompletedAt(task.getCompletedAt());
        res.setDueDate(task.getDueDate());
        res.setCreatedAt(task.getCreatedAt());
        res.setUpdatedAt(task.getUpdatedAt());
        if (task.getAssignee() != null) {
            res.setAssigneeId(task.getAssignee().getId());
            res.setAssigneeName(task.getAssignee().getName());
            res.setAssigneeEmail(task.getAssignee().getEmail());
        }
        if (task.getReporter() != null) {
            res.setReporterId(task.getReporter().getId());
            res.setReporterName(task.getReporter().getName());
        }
        return res;
    }

    private TaskHistoryResponse toTaskHistoryResponse(TaskHistory history) {
        TaskHistoryResponse res = new TaskHistoryResponse();
        res.setId(history.getId());
        res.setOldStatus(history.getOldStatus());
        res.setNewStatus(history.getNewStatus());
        res.setProgressAtThatTime(history.getProgressAtThatTime());
        res.setChangedAt(history.getChangedAt());
        if (history.getTask() != null) {
            res.setTaskId(history.getTask().getId());
            if (history.getTask().getProject() != null) {
                res.setProjectId(history.getTask().getProject().getId());
            }
        }
        if (history.getUser() != null) {
            res.setUserId(history.getUser().getId());
            res.setUserName(history.getUser().getName());
            res.setUserEmail(history.getUser().getEmail());
        }
        return res;
    }

    public List<TaskResponse> getMyTasks(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));

        List<Task> tasks = taskRepository.findByAssigneeId(currentUser.getId());

        return tasks.stream()
                .map(this::toResponse) // Dùng hàm toResponse ở dưới của bạn
                .collect(Collectors.toList());
    }
    public TaskResponse getTaskById(Integer taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy Task với ID: " + taskId));
        return toResponse(task);
    }
    @Transactional
    public TaskResponse updateTask(Integer projectId, Integer taskId, CreateTaskRequest request, String email) {
        User currentUser = userRepository.findByEmail(email).orElseThrow();
        ProjectMember projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUser.getId())
        .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên của dự án này!"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task không tồn tại"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalStateException("Task không thuộc dự án này!");
        }
        boolean isManager = projectMember.getRole().equals("OWNER") || projectMember.getRole().equals("MANAGER");
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());

        if (!isManager && !isAssignee) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật công việc của người khác!");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setUpdatedAt(LocalDateTime.now());

        Task updated = taskRepository.save(task);
        return toResponse(updated);
    }
    @Transactional
    public TaskResponse updateTaskAssignee(Integer projectId, Integer taskId, Integer assigneeId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task không tồn tại"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalStateException("Task không thuộc dự án này!");
        }
        if (assigneeId != null) {
            User assignee = userRepository.findById(Long.valueOf(assigneeId))
                    .orElseThrow(() -> new NoSuchElementException("Người được giao việc không tồn tại"));
            
            if (!isOwner(task.getProject(), assignee.getEmail()) && !isActiveMember(projectId, assignee.getId())) {
                throw new IllegalStateException("Người này không phải thành viên tích cực của dự án");
            }
            
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null); 
        }

        task.setUpdatedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        return toResponse(saved);
    }
    public List<TaskResponse> listAllTasksInProject(Integer projectId, String email) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy dự án"));
        List<Task> tasks = taskRepository.findByProjectId(projectId);
                return tasks.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
