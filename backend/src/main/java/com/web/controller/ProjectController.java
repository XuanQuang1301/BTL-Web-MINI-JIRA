package com.web.controller;

import com.web.dto.member.AddMemberRequest;
import com.web.dto.member.MemberResponse;
import com.web.dto.project.ApproveMemberRequest;
import com.web.dto.project.CreateProjectRequest;
import com.web.dto.project.JoinProjectRequest;
import com.web.dto.project.ProjectResponse;
import com.web.dto.project.UpdateProjectRequest;
import com.web.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/project")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // POST /api/project/create
    @PostMapping("/create")
    public ResponseEntity<?> create(@Valid @RequestBody CreateProjectRequest request, Authentication auth) {
        String email = auth.getName();
        ProjectResponse created = projectService.createProject(request, email);
        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/project/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    // GET /api/project/my
    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> listMyProjects(Authentication auth) {
        List<ProjectResponse> projects = projectService.listMyProjects(auth.getName());
        return ResponseEntity.ok(projects);
    }

    // GET /api/project/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable Integer id) {
        ProjectResponse res = projectService.getById(id);
        return ResponseEntity.ok(res);
    }

    // PATCH /api/project/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(@PathVariable Integer id,
            @Valid @RequestBody UpdateProjectRequest request,
            Authentication auth) {
        ProjectResponse updated = projectService.updateProject(id, request, auth.getName());
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/project/delete/{id}
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication auth) {
        projectService.deleteById(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler({ IllegalStateException.class, DataIntegrityViolationException.class })
    public ResponseEntity<?> handleConflict(RuntimeException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleForbidden(AccessDeniedException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
    }

    // POST /api/project/{id}/members
    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable Integer id,
            @Valid @RequestBody AddMemberRequest request,
            Authentication auth) {
        MemberResponse created = projectService.addMember(id, request, auth.getName());
        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/project/{id}/members/{memberId}")
                .buildAndExpand(id, created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    // GET /api/project/{id}/members
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(@PathVariable Integer id) {
        List<MemberResponse> members = projectService.listMembers(id);
        return ResponseEntity.ok(members);
    }
    // POST /api/project/join
    @PostMapping("/join")
    public ResponseEntity<?> joinProjectByCode(@Valid @RequestBody JoinProjectRequest request, Authentication auth) {
        projectService.joinProjectByCode(request.getProjectCode(), auth.getName());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Gửi yêu cầu tham gia thành công. Vui lòng chờ quản trị viên phê duyệt.");
        return ResponseEntity.ok(response);
    }

    // POST /api/project/approve
    @PostMapping("/approve")
    public ResponseEntity<?> approveMember(@Valid @RequestBody ApproveMemberRequest request, Authentication auth) {
        projectService.approveMember(request.getMemberRecordId(), auth.getName());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã phê duyệt thành viên vào dự án!");
        return ResponseEntity.ok(response);
    }

    // GET /api/project/{id}/pending
    @GetMapping("/{id}/pending")
    public ResponseEntity<List<MemberResponse>> getPendingMembers(@PathVariable Integer id, Authentication auth) {
        List<MemberResponse> pendingMembers = projectService.getPendingMembers(id, auth.getName());
        return ResponseEntity.ok(pendingMembers);
    }
}
