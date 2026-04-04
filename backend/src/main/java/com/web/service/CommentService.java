package com.web.service;

import com.web.dto.comment.CommentResponse;
import com.web.dto.comment.CreateCommentRequest;
import com.web.entity.Comment;
import com.web.entity.Project;
import com.web.entity.Task;
import com.web.entity.User;
import com.web.repository.CommentRepository;
import com.web.repository.TaskRepository;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    public List<CommentResponse> listComments(Integer projectId, Integer taskId, String requesterEmail) {
        findTask(projectId, taskId); 
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse createComment(Integer projectId, Integer taskId, CreateCommentRequest req,
            String requesterEmail) {
        Task task = findTask(projectId, taskId);
        User requester = findUser(requesterEmail);
        
        Comment comment = new Comment();
        comment.setContent(req.getContent().trim());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setTask(task);
        comment.setUser(requester);

        Comment saved = commentRepository.save(comment);
        return toResponse(saved);
    }

    public void deleteComment(Integer projectId, Integer taskId, Integer commentId, String requesterEmail) {
        findTask(projectId, taskId); 
        
        Comment comment = commentRepository.findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay comment id=" + commentId));
        if (!comment.getUser().getEmail().equalsIgnoreCase(requesterEmail) && !isOwner(comment.getTask().getProject(), requesterEmail)) {
            throw new AccessDeniedException("Ban chi co the xoa binh luan cua chinh minh!");
        }

        commentRepository.delete(comment);
    }

    private Task findTask(Integer projectId, Integer taskId) {
        return taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay task id=" + taskId));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Khong tim thay user: " + email));
    }

    private boolean isOwner(Project project, String email) {
        return project != null
                && project.getOwner() != null
                && project.getOwner().getEmail() != null
                && project.getOwner().getEmail().equalsIgnoreCase(email);
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse res = new CommentResponse();
        res.setId(comment.getId());
        res.setContent(comment.getContent());
        res.setCreatedAt(comment.getCreatedAt());
        
        if (comment.getTask() != null) {
            res.setTaskId(comment.getTask().getId());
            if (comment.getTask().getProject() != null) {
                res.setProjectId(comment.getTask().getProject().getId());
            }
        }
                if (comment.getUser() != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", comment.getUser().getId());
            userMap.put("name", comment.getUser().getName());
            userMap.put("email", comment.getUser().getEmail());
            res.setUser(userMap);
        }
        
        return res;
    }
}