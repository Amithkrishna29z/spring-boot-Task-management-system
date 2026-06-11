package com.amith.taskmanager.service;

import com.amith.taskmanager.dto.PaginatedResponse;
import com.amith.taskmanager.dto.StatisticsResponseDTO;
import com.amith.taskmanager.dto.TaskRequestDTO;
import com.amith.taskmanager.dto.TaskResponseDTO;
import com.amith.taskmanager.exception.TaskNotFoundException;
import com.amith.taskmanager.exception.UserNotFoundException;
import com.amith.taskmanager.model.Task;
import com.amith.taskmanager.model.Task.TaskPriority;
import com.amith.taskmanager.model.Task.TaskStatus;
import com.amith.taskmanager.repository.TaskRepository;
import com.amith.taskmanager.repository.UserRepository;
import com.amith.taskmanager.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TaskService {

    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "updatedAt", "dueDate", "priority", "status", "title");

    @Value("${pagination.max.size:100}")
    private int maxPageSize;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @CacheEvict(value = "tasks", allEntries = true)
    public TaskResponseDTO createTask(TaskRequestDTO taskDTO) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        logger.info("Creating task for user: {}", principal.getUsername());

        var user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Task task = new Task();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : TaskStatus.TODO);
        task.setPriority(taskDTO.getPriority() != null ? taskDTO.getPriority() : TaskPriority.MEDIUM);
        task.setDueDate(taskDTO.getDueDate());
        task.setUser(user);

        Task savedTask = taskRepository.save(task);
        logger.info("Task created successfully with id: {}", savedTask.getId());
        return convertToResponseDTO(savedTask);
    }

    public PaginatedResponse<TaskResponseDTO> getTasks(
            int page,
            int size,
            String sortBy,
            String sortDirection,
            TaskStatus status,
            TaskPriority priority,
            String keyword
    ) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Validate and limit page size
        if (size > maxPageSize) {
            logger.warn("Requested page size {} exceeds maximum {}, limiting to {}", size, maxPageSize, maxPageSize);
            size = maxPageSize;
        }

        // Sanitize keyword to prevent SQL injection
        String sanitizedKeyword = sanitizeKeyword(keyword);

        // Whitelist sortBy to prevent arbitrary field exposure / JPQL errors
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            logger.warn("Invalid sortBy field '{}', defaulting to 'createdAt'", sortBy);
            sortBy = "createdAt";
        }

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Task> taskPage = taskRepository.findTasksByFilters(
                principal.getId(),
                status,
                priority,
                sanitizedKeyword,
                pageable
        );

        List<TaskResponseDTO> content = taskPage.getContent().stream()
                .map(this::convertToResponseDTO)
                .toList();

        return new PaginatedResponse<>(
                content,
                taskPage.getNumber(),
                taskPage.getSize(),
                taskPage.getTotalElements(),
                taskPage.getTotalPages(),
                taskPage.hasNext(),
                taskPage.hasPrevious()
        );
    }

    public TaskResponseDTO getTaskById(Long id) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        logger.debug("Fetching task {} for user: {}", id, principal.getUsername());

        Task task = taskRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new TaskNotFoundException(id));
        return convertToResponseDTO(task);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public TaskResponseDTO updateTask(Long id, TaskRequestDTO taskDTO) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        logger.info("Updating task {} for user: {}", id, principal.getUsername());

        // findByIdAndUserId already enforces ownership — no extra check needed
        Task task = taskRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new TaskNotFoundException(id));

        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus());
        task.setPriority(taskDTO.getPriority());
        task.setDueDate(taskDTO.getDueDate());

        Task updatedTask = taskRepository.save(task);
        logger.info("Task {} updated successfully", id);
        return convertToResponseDTO(updatedTask);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public void deleteTask(Long id) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        logger.info("Deleting task {} for user: {}", id, principal.getUsername());

        // findByIdAndUserId already enforces ownership — no extra check needed
        taskRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new TaskNotFoundException(id));

        taskRepository.deleteByIdAndUserId(id, principal.getId());
        logger.info("Task {} deleted successfully", id);
    }

    public StatisticsResponseDTO getTaskStatistics() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return getTaskStatisticsForUser(principal.getId());
    }

    @Cacheable(value = "statistics", key = "#userId")
    public StatisticsResponseDTO getTaskStatisticsForUser(Long userId) {
        long totalTasks = taskRepository.countByUserId(userId);
        long todoTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        long doneTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.DONE);

        return new StatisticsResponseDTO(totalTasks, todoTasks, inProgressTasks, doneTasks);
    }

    private TaskResponseDTO convertToResponseDTO(Task task) {
        return new TaskResponseDTO(
                task.getId(),
                sanitizeOutput(task.getTitle()),
                sanitizeOutput(task.getDescription()),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private String sanitizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        // Remove potentially dangerous characters
        return keyword.replaceAll("[;'\"\\\\]", "");
    }

    private String sanitizeOutput(String input) {
        if (input == null) {
            return null;
        }
        // Basic HTML escaping
        return input.replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
