package com.web.service;

import com.web.dto.member.AddMemberRequest;
import com.web.dto.member.MemberResponse;
import com.web.dto.project.CreateProjectRequest;
import com.web.dto.project.ProjectResponse;
import com.web.dto.project.UpdateProjectRequest;
import com.web.entity.Project;
import com.web.entity.ProjectMember;
import com.web.entity.User;
import com.web.repository.ProjectMemberRepository;
import com.web.repository.ProjectRepository;
import com.web.repository.TaskRepository;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private TaskRepository taskRepository;

    public ProjectResponse createProject(CreateProjectRequest req, String ownerEmail) {
        String normalizedKey = req.getKey().trim().toUpperCase();

        if (projectRepository.existsByKey(normalizedKey)) {
            throw new IllegalStateException("Key project da ton tai: " + normalizedKey);
        }

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + ownerEmail));

        Project p = new Project();
        p.setName(req.getName().trim());
        p.setKey(normalizedKey);
        p.setDescription(req.getDescription());
        p.setStatus(Project.ProjectStatus.PLANNING);
        p.setCreatedAt(LocalDateTime.now());
        p.setOwner(owner);

        Project saved = projectRepository.save(p);
        return toResponse(saved);
    }

    public ProjectResponse getById(Integer id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + id));
        return toResponse(p);
    }

    public ProjectResponse updateProject(Integer id, UpdateProjectRequest req, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + id));

        if (project.getOwner() == null || project.getOwner().getEmail() == null
                || !project.getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("Ban khong co quyen cap nhat project nay");
        }

        if (req.getName() != null) {
            project.setName(req.getName().trim());
        }

        if (req.getKey() != null) {
            String normalizedKey = req.getKey().trim().toUpperCase();
            if (!normalizedKey.equals(project.getKey()) && projectRepository.existsByKey(normalizedKey)) {
                throw new IllegalStateException("Key project da ton tai: " + normalizedKey);
            }
            project.setKey(normalizedKey);
        }

        if (req.getDescription() != null) {
            String description = req.getDescription().trim();
            project.setDescription(description.isEmpty() ? null : description);
        }

        if (req.getStatus() != null) {
            project.setStatus(Project.ProjectStatus.valueOf(req.getStatus().trim().toUpperCase()));
        }

        Project saved = projectRepository.save(project);
        return toResponse(saved);
    }

    @Transactional
    public void deleteById(Integer id, String requesterEmail) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + id));

        if (p.getOwner() == null || p.getOwner().getEmail() == null ||
                !p.getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("Ban khong duoc quyen xoa project nay");
        }
        try {
            taskRepository.clearProjectByProjectId(id);
            projectMemberRepository.clearProjectByProjectId(id);
            projectRepository.delete(p);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Khong the xoa project dang duoc tham chieu");
        }
    }

    public MemberResponse addMember(Integer projectId, AddMemberRequest req, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + projectId));

        if (project.getOwner() == null || project.getOwner().getEmail() == null ||
                !project.getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("Ban khong co quyen them thanh vien vao project nay");
        }

        String email = req.getEmail().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user voi email: " + email));

        if (email.equalsIgnoreCase(project.getOwner().getEmail().trim())) {
            throw new IllegalStateException("Không thể thao tác với owner của project");
        }

        if (projectMemberRepository.existsByProjectAndUser(project, user)) {
            throw new IllegalStateException("Nguoi dung da la thanh vien cua project");
        }

        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(user);
        String role = (req.getRole() == null || req.getRole().trim().isEmpty()) ? "MEMBER" : req.getRole().trim();
        pm.setRole(role);
        pm.setJoinedAt(LocalDateTime.now());

        ProjectMember saved = projectMemberRepository.save(pm);
        return toMemberResponse(saved);
    }

    public List<MemberResponse> listMembers(Integer projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay project id=" + projectId));

        // if (projectMemberRepository.findByProjectId(projectId).isEmpty()) {
        //     throw new NoSuchElementException("Chưa có người dùng nào trong project");
        // }

        return projectMemberRepository.findByProjectId(projectId)
                .stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());
    }

    private MemberResponse toMemberResponse(ProjectMember pm) {
        MemberResponse res = new MemberResponse();
        res.setId(pm.getId());
        if (pm.getProject() != null) {
            res.setProjectId(pm.getProject().getId());
        }
        if (pm.getUser() != null) {
            res.setUserId(pm.getUser().getId());
            res.setUserName(pm.getUser().getName());
            res.setUserEmail(pm.getUser().getEmail());
        }
        res.setRole(pm.getRole());
        res.setJoinedAt(pm.getJoinedAt());
        res.setLeftAt(pm.getLeftAt());
        return res;
    }

    public java.util.List<ProjectResponse> listMyProjects(String requesterEmail) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + requesterEmail));
        java.util.List<Project> projects = projectRepository.findAllInvolvedByUserId(user.getId());
        return projects.stream().map(p -> {
            ProjectResponse res = toResponse(p);
            String role = null;
            if (p.getOwner() != null && p.getOwner().getId() != null && p.getOwner().getId().equals(user.getId())) {
                role = "MANAGER";
            } else {
                java.util.Optional<ProjectMember> pmOpt = projectMemberRepository.findByProjectIdAndUserId(p.getId(),
                        user.getId());
                if (pmOpt.isPresent() && pmOpt.get().getLeftAt() == null) {
                    String r = pmOpt.get().getRole();
                    role = (r == null || r.trim().isEmpty()) ? "MEMBER" : r.trim();
                }
            }
            if (role == null) {
                role = "MEMBER";
            }
            res.setRole(role);
            return res;
        }).collect(java.util.stream.Collectors.toList());
    }

    private ProjectResponse toResponse(Project p) {
        ProjectResponse res = new ProjectResponse();
        res.setId(p.getId());
        res.setName(p.getName());
        res.setKey(p.getKey());
        res.setDescription(p.getDescription());
        res.setStatus(p.getStatus() != null ? p.getStatus().name() : null);
        res.setCreatedAt(p.getCreatedAt());
        if (p.getOwner() != null) {
            res.setOwnerId(p.getOwner().getId());
            res.setOwnerName(p.getOwner().getName());
        }
        return res;
    }
    @Transactional
    public void joinProjectByCode(String projectCode, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
        Project project = projectRepository.findByKey(projectCode)
                .orElseThrow(() -> new NoSuchElementException("Mã dự án không tồn tại"));

        Optional<ProjectMember> existingMember = projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId());
        if (existingMember.isPresent()) {
            ProjectMember member = existingMember.get();
            if ("PENDING".equals(member.getStatus())) {
                throw new IllegalStateException("Bạn đã gửi yêu cầu rồi, vui lòng chờ duyệt.");
            } else {
                throw new IllegalStateException("Bạn đã là thành viên của dự án này.");
            }
        }

        ProjectMember newMember = new ProjectMember();
        newMember.setProject(project);
        newMember.setUser(user);
        newMember.setRole("MEMBER"); 
        newMember.setStatus("PENDING"); 
        newMember.setJoinedAt(LocalDateTime.now());
        projectMemberRepository.save(newMember);
    }

    @Transactional
    public void approveMember(Integer memberRecordId, String email) {
        ProjectMember memberRecord = projectMemberRepository.findById(memberRecordId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy yêu cầu gia nhập"));
        Project project = memberRecord.getProject();
        if (!project.getOwner().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền duyệt thành viên");
        }

        memberRecord.setStatus("JOINED");
        projectMemberRepository.save(memberRecord);
    }
    public List<MemberResponse> getPendingMembers(Integer projectId, String email) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy dự án"));
        if (!project.getOwner().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Bạn không có quyền xem danh sách chờ duyệt");
        }
        return projectMemberRepository.findByProjectIdAndStatus(projectId, "PENDING")
                .stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());
    }
}
