package com.web.entity;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sub_tasks")
@Getter
@Setter
public class SubTask {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; 
    @Column(nullable = false)
    private String content; 
    @Column (name = "isDone", nullable = false)
    private boolean isDone = false; 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taskId", nullable = false)
    @JsonIgnore
    private Task task; 
    @Column(name = "createdAt")
    private LocalDateTime createdAt = LocalDateTime.now(); 
}
          