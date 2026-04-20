package com.web.dto.task;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class CreateTaskRequest {

    @NotBlank(message = "Tieu de task khong duoc de trong")
    @Size(max = 255, message = "Tieu de toi da 255 ky tu")
    private String title;

    @Size(max = 2000, message = "Mo ta toi da 2000 ky tu")
    private String description;

    // @NotBlank(message = "Email nguoi duoc giao khong duoc de trong")
    @Email(message = "Email khong hop le")
    private String assigneeEmail;

    private String priority;

    private Double estimatedHours;

    private LocalDateTime dueDate;

    private Integer progress;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAssigneeEmail() {
        return assigneeEmail;
    }

    public void setAssigneeEmail(String assigneeEmail) {
        this.assigneeEmail = assigneeEmail;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Double getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(Double estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }
}