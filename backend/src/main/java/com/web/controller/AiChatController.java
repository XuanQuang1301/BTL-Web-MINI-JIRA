package com.web.controller;

import com.web.dto.AI.SubTaskDto;
import com.web.dto.AI.TaskBreakdownRequest;
import com.web.dto.AI.TaskDto;
import com.web.service.AiTaskBreakdownService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chatbot/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiTaskBreakdownService aiTaskBreakdownService;

    /**
     * Phân tích yêu cầu theo cấp độ:
     * - level = "PROJECT" → trả về List<TaskDto>
     * - level = "TASK"    → trả về List<SubTaskDto>
     */
    @PostMapping("/breakdown")
    public ResponseEntity<?> breakdown(@Valid @RequestBody TaskBreakdownRequest request) {
        log.info("AI Breakdown — level: {}, message: {}", request.getLevel(), request.getMessage());

        if (BreakdownLevel.PROJECT.matches(request.getLevel())) {
            List<TaskDto> tasks = aiTaskBreakdownService.breakdownProject(request.getMessage());
            return ResponseEntity.ok(tasks);
        }

        List<SubTaskDto> subtasks = aiTaskBreakdownService.breakdownTask(request.getMessage());
        return ResponseEntity.ok(subtasks);
    }

    // -------------------------------------------------------------------------
    // Inner enum – tránh magic string "PROJECT" / "TASK" rải rác trong code
    // -------------------------------------------------------------------------
    private enum BreakdownLevel {
        PROJECT, TASK;

        boolean matches(String value) {
            return name().equalsIgnoreCase(value);
        }
    }
}