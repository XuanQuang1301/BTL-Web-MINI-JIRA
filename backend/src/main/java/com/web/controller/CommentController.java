package com.web.controller;

import com.web.dto.comment.CommentResponse;
import com.web.dto.comment.CreateCommentRequest;
import com.web.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project/{projectId}/tasks/{taskId}/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    @Autowired
    private CommentService commentService;

    // GET /api/project/{projectId}/tasks/{taskId}/comments
    @GetMapping
    public ResponseEntity<List<CommentResponse>> listComments(
            @PathVariable Integer projectId,
            @PathVariable Integer taskId,
            Authentication auth) {
        List<CommentResponse> comments = commentService.listComments(projectId, taskId, auth.getName());
        return ResponseEntity.ok(comments);
    }

    // POST /api/project/{projectId}/tasks/{taskId}/comments
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Integer projectId,
            @PathVariable Integer taskId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication auth) {
        CommentResponse created = commentService.createComment(projectId, taskId, request, auth.getName());
        return ResponseEntity.ok(created);
    }

    // DELETE /api/project/{projectId}/tasks/{taskId}/comments/{commentId}
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Integer projectId,
            @PathVariable Integer taskId,
            @PathVariable Integer commentId,
            Authentication auth) {
        commentService.deleteComment(projectId, taskId, commentId, auth.getName());
        return ResponseEntity.noContent().build();
    }
}