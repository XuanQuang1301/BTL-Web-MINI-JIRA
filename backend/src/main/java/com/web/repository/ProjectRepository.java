package com.web.repository;

import com.web.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {
    boolean existsByKey(String key);

    Optional<Project> findByKey(String key);

    /**
     * Returns projects where the given user is the owner OR an active member
     * (leftAt is null).
     * Ordered by createdAt DESC.
     */
    @Query("SELECT DISTINCT p FROM Project p " +
            "LEFT JOIN com.web.entity.ProjectMember pm ON pm.project = p " +
            "WHERE p.owner.id = :userId OR (pm.user.id = :userId AND pm.leftAt IS NULL) " +
            "ORDER BY p.createdAt DESC")
    List<Project> findAllInvolvedByUserId(@Param("userId") Long userId);
}