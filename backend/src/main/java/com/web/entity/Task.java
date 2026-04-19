package com.web.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tasks")
@Getter
@Setter
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;

    private String status = "TODO";

    private String priority = "MEDIUM";

    private Double position = 0.0;

    private Integer progress = 0;

    private Double estimatedHours = 0.0;

    private Double actualHours = 0.0;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime dueDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    
    @ManyToOne
    @JoinColumn(name = "projectId")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "assigneeId")
    private User assignee;

    @ManyToOne
    @JoinColumn(name = "reporterId")
    private User reporter;

    @OneToMany(mappedBy = "task")
    private List<Comment> comments;

    @OneToMany(mappedBy = "task")
    private List<TaskHistory> histories;

    @Override
    public String toString() {
        return "Task [id=" + id + ", title=" + title + ", description=" + description + ", status=" + status
                + ", priority=" + priority + ", position=" + position + ", progress=" + progress + ", estimatedHours="
                + estimatedHours + ", actualHours=" + actualHours + ", startedAt=" + startedAt + ", completedAt="
                + completedAt + ", dueDate=" + dueDate + ", createdAt=" + createdAt + ", updatedAt=" + updatedAt
                + ", project=" + project + ", assignee=" + assignee + ", reporter=" + reporter + ", comments="
                + comments + ", histories=" + histories + "]";
    }

}
