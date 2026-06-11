package com.amith.taskmanager.controller;

import com.amith.taskmanager.dto.PaginatedResponse;
import com.amith.taskmanager.dto.StatisticsResponseDTO;
import com.amith.taskmanager.dto.TaskRequestDTO;
import com.amith.taskmanager.dto.TaskResponseDTO;
import com.amith.taskmanager.model.Task.TaskPriority;
import com.amith.taskmanager.model.Task.TaskStatus;
import com.amith.taskmanager.service.TaskService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks", description = "CRUD and statistics for the authenticated user's tasks")
@Validated
public class TaskController {

    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskService taskService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<TaskResponseDTO>> getTasks(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String keyword
    ) {
        logger.debug("Fetching tasks - page: {}, size: {}, sortBy: {}", page, size, sortBy);
        PaginatedResponse<TaskResponseDTO> response = taskService.getTasks(
                page, size, sortBy, sortDirection, status, priority, keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponseDTO> getStatistics() {
        logger.debug("Fetching task statistics");
        StatisticsResponseDTO statistics = taskService.getTaskStatistics();
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> getTask(@PathVariable Long id) {
        logger.debug("Fetching task with id: {}", id);
        TaskResponseDTO task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(@Valid @RequestBody TaskRequestDTO taskDTO) {
        logger.info("Creating new task: {}", taskDTO.getTitle());
        TaskResponseDTO createdTask = taskService.createTask(taskDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequestDTO taskDTO
    ) {
        logger.info("Updating task with id: {}", id);
        TaskResponseDTO updatedTask = taskService.updateTask(id, taskDTO);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        logger.info("Deleting task with id: {}", id);
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}