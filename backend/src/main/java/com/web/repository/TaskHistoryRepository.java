package com.web.repository;

import com.web.entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Integer> {
    List<TaskHistory> findByTaskIdOrderByChangedAtDesc(Integer taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update TaskHistory th set th.task = null where th.task.id = :taskId")
    int clearTaskByTaskId(@Param("taskId") Integer taskId);
}
