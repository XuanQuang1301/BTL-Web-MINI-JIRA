package com.web.dto.AI;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskDto {
    private String title;
    private String description;
    private LocalDate dueDate;
    private Long assigneeId;
    private String priority;
}
