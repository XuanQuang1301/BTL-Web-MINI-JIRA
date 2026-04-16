package com.web.dto.AI;
import lombok.Data;
import java.time.LocalDate;

@Data // Dùng Lombok để tự tạo Getter/Setter
public class TaskBatchRequest {
    private String title;
    private String description;
    private LocalDate dueDate;
    private Long assigneeId;
}