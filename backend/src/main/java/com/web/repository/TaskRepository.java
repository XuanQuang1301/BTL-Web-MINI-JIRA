package com.web.repository;

import com.web.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByProjectIdAndAssigneeId(Integer projectId, Long assigneeId);
    List<Task> findByAssigneeId(Long assigneeId); 
    Optional<Task> findByIdAndProjectId(Integer id, Integer projectId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Task t set t.project = null where t.project.id = :projectId")
    int clearProjectByProjectId(@Param("projectId") Integer projectId);
    @Modifying
    @Transactional
    @Query("UPDATE Task t SET t.progress = :progress WHERE t.id = :id")
    void updateProgress(@Param("id") Integer id, @Param("progress") int progress);
    List<Task> findByProjectId(Integer projectId);
}
