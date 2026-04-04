package com.web.service;

import com.web.dto.subtask.SubTaskResponse; 
import com.web.entity.SubTask;
import com.web.entity.Task;
import com.web.repository.SubTaskRepository;
import com.web.repository.TaskRepository;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class SubTaskService {

    @Autowired 
    private SubTaskRepository subTaskRepository;

    @Autowired 
    private TaskRepository taskRepository;
    private void updateTaskProgressAuto(Integer taskId) {
        List<SubTask> allSubs = subTaskRepository.findByTaskId(taskId);
        if (allSubs.isEmpty()) {
            taskRepository.updateProgress(taskId, 0);
            return;
        }

        long doneCount = allSubs.stream().filter(SubTask::isDone).count();
        int percentage = (int) Math.round((double) doneCount / allSubs.size() * 100);
        
        taskRepository.updateProgress(taskId, percentage);
    }
    public List<SubTaskResponse> getSubTasks(Integer taskId) {
        return subTaskRepository.findByTaskId(taskId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubTaskResponse createSubTask(Integer taskId, String content) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy Task cha"));
        
        SubTask sub = new SubTask();
        sub.setTask(task);
        sub.setContent(content);
        sub.setDone(false);
        
        SubTask saved = subTaskRepository.save(sub);
        updateTaskProgressAuto(taskId);
        return toResponse(saved);
    }

    @Transactional
public SubTask toggleSubTask(Integer subTaskId, Boolean isDone) {
    SubTask subTask = subTaskRepository.findById(subTaskId)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy SubTask"));
    subTask.setDone(isDone);
    subTask = subTaskRepository.save(subTask);
    Task parentTask = subTask.getTask();
    if (parentTask != null) {
        List<SubTask> allSubTasks = subTaskRepository.findByTaskId(parentTask.getId());
        
        if (allSubTasks.isEmpty()) {
            parentTask.setProgress(0);
        } else {
            long doneCount = allSubTasks.stream().filter(s -> s.isDone()).count();
                        int newProgress = (int) Math.round((double) doneCount / allSubTasks.size() * 100);
            
            parentTask.setProgress(newProgress);
        }
                taskRepository.save(parentTask);
    }
    return subTask;
}
    private SubTaskResponse toResponse(SubTask sub) {
        SubTaskResponse res = new SubTaskResponse();
        res.setId(sub.getId());
        res.setContent(sub.getContent());
        res.setDone(sub.isDone());
        res.setCreatedAt(sub.getCreatedAt());
        if (sub.getTask() != null) {
            res.setTaskId(sub.getTask().getId());
        }
        return res;
    }
    @Transactional
    public void deleteSubTask(Integer id) {
        SubTask sub = subTaskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy Subtask để xóa"));
        Integer taskId = sub.getTask().getId();
        subTaskRepository.delete(sub);
        updateTaskProgressAuto(taskId);
    }
}