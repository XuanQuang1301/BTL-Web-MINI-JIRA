package com.web.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
@Entity
@Table(name = "comments")
@Getter
@Setter
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "createdAt", nullable = false) 
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "taskId", referencedColumnName = "id")    private Task task;

    @ManyToOne
    @JoinColumn(name = "userId", referencedColumnName = "id", nullable = false)
    private User user;


    @Override
    public String toString() {
        return "Comment [id=" + id + ", content=" + content + ", createdAt=" + createdAt + ", task=" + task + ", user="
                + user + "]";
    }

}
