package com.web.dto.AI;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TaskBreakdownRequest {

    @NotBlank(message = "Nội dung yêu cầu không được để trống")
    private String message;

    /**
     * Nhận giá trị "PROJECT" hoặc "TASK" từ Frontend.
     * Mặc định là "TASK" nếu không truyền lên.
     */
    @Pattern(regexp = "(?i)PROJECT|TASK", message = "level chỉ chấp nhận PROJECT hoặc TASK")
    private String level = "TASK";
}