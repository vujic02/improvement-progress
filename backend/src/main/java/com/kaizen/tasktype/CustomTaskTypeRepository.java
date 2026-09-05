package com.kaizen.tasktype;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomTaskTypeRepository extends JpaRepository<CustomTaskType, Long> {

    List<CustomTaskType> findByUserIdOrderByIdAsc(Long userId);

    Optional<CustomTaskType> findByIdAndUserId(Long id, Long userId);

    /** The column collation is case-insensitive, so this is a CI check. */
    boolean existsByUserIdAndLabel(Long userId, String label);

    long countByUserId(Long userId);
}
