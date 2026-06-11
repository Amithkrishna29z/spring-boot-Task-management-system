package com.amith.taskmanager.repository;

import com.amith.taskmanager.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // cast :keyword to string so Postgres can infer its type when it's null. without this it
    // defaults to bytea and LOWER(bytea) blows up (H2 doesn't care, Postgres does).
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:keyword IS NULL OR " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))))")
    Page<Task> findTasksByFilters(
            @Param("userId") Long userId,
            @Param("status") Task.TaskStatus status,
            @Param("priority") Task.TaskPriority priority,
            @Param("keyword") String keyword,
            Pageable pageable);

    Optional<Task> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status);
}
