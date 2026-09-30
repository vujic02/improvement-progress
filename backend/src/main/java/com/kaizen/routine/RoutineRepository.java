package com.kaizen.routine;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    /** Oldest first - the order they were set up in. */
    List<Routine> findByUserIdOrderByIdAsc(Long userId);

    Optional<Routine> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /** Deleting a custom task type takes the routines that use it. */
    void deleteByUserIdAndCustomTypeId(Long userId, Long customTypeId);
}
