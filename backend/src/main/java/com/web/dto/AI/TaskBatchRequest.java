package com.web.dto.AI;
import lombok.Data;
import java.time.LocalDate;

@Data 
public class TaskBatchRequest {
    private String title;
    private String description;
    private LocalDate dueDate;
    private Long assigneeId;
}