package com.web.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "task_history")
@Getter
@Setter
public class TaskHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String oldStatus;

    @Column(nullable = false)
    private String newStatus;

    private Integer progressAtThatTime;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @ManyToOne
    @JoinColumn(name = "taskId")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @Override
    public String toString() {
        return "TaskHistory [id=" + id + ", oldStatus=" + oldStatus + ", newStatus=" + newStatus
                + ", progressAtThatTime=" + progressAtThatTime + ", changedAt=" + changedAt + ", task=" + task
                + ", user=" + user + "]";
    }

}
