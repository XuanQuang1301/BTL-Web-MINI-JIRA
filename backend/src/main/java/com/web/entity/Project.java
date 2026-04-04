package com.web.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.Data; 
@Entity
@Table(name = "projects")
@Getter
@Setter
@Data
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(name = "`key`", nullable = false, unique = true)
    private String key;

    private String description;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "ownerId")
    private User owner;

    @OneToMany(mappedBy = "project")
    private List<Task> tasks;

    public enum ProjectStatus {
        PLANNING,
        IN_PROGRESS,
        COMPLETED,
        ON_HOLD,
        ARCHIVED
    }

    @Override
    public String toString() {
        return "Project [id=" + id + ", name=" + name + ", key=" + key + ", description=" + description + ", status="
                + status + ", createdAt=" + createdAt + ", owner=" + owner + ", tasks=" + tasks + "]";
    }

}
