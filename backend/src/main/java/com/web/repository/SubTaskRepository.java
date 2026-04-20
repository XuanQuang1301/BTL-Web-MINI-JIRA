package com.web.repository;

import com.web.entity.SubTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubTaskRepository extends JpaRepository<SubTask, Integer> {
    List<SubTask> findByTaskId(Integer taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from SubTask st where st.task.id = :taskId")
    int deleteByTaskId(@Param("taskId") Integer taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from SubTask st where st.task.id in (select t.id from Task t where t.project.id = :projectId)")
    int deleteByProjectId(@Param("projectId") Integer projectId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE SubTask st SET st.isDone = true WHERE st.task.id = :taskId")
    int markAllDoneByTaskId(@Param("taskId") Integer taskId);
}
