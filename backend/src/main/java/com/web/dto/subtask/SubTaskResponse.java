package com.web.dto.subtask;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubTaskResponse {
    private Integer id;
    private Integer taskId; // Chỉ trả về ID của Task cha cho nhẹ
    private String content;
    private boolean isDone;
    private LocalDateTime createdAt;
}
