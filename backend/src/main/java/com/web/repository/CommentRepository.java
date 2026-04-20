package com.web.repository;

import com.web.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    Optional<Comment> findByIdAndTaskId(Integer id, Integer taskId);

    List<Comment> findByTaskIdOrderByCreatedAtAsc(Integer taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Comment c set c.task = null where c.task.id = :taskId")
    int clearTaskByTaskId(@Param("taskId") Integer taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Comment c where c.task.id in (select t.id from Task t where t.project.id = :projectId)")
    int deleteByProjectId(@Param("projectId") Integer projectId);
    List<Comment> findByTaskIdOrderByCreatedAtDesc(Integer taskId);
}
