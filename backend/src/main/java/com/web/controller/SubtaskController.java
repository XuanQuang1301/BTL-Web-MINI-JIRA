package com.web.controller;
import com.web.service.SubTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE})
@RequestMapping("/api/subtasks")

public class SubtaskController {
    @Autowired private SubTaskService subTaskService;

    @GetMapping("/task/{taskId}")
    public ResponseEntity<?> getByTask(@PathVariable Integer taskId) {
        return ResponseEntity.ok(subTaskService.getSubTasks(taskId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        Integer taskId = (Integer) payload.get("taskId");
        String content = (String) payload.get("content");
        return ResponseEntity.ok(subTaskService.createSubTask(taskId, content));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        Object value = payload.get("isDone");
        Boolean status = (value instanceof Boolean) ? (Boolean) value : false;
        
        return ResponseEntity.ok(subTaskService.toggleSubTask(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        subTaskService.deleteSubTask(id);
        return ResponseEntity.noContent().build();
    }
}