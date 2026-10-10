package com.kaizen.routine;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    /** Oldest first - the order they were set up in. */
    List<Routine> findByUserIdOrderByIdAsc(Long userId);

    Optional<Routine> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /** The routines linked to any of these goals - what their cards show as habits. */
    List<Routine> findByUserIdAndPursuitIdInOrderByIdAsc(Long userId, List<Long> pursuitIds);

    /** A deleted goal's routines carry on unlinked; ON DELETE SET NULL says the same in the schema. */
    @Modifying
    @Query("update Routine r set r.pursuitId = null where r.pursuitId = :pursuitId")
    void unlinkFromPursuit(@Param("pursuitId") Long pursuitId);

    /** Deleting a custom task type takes the routines that use it. */
    void deleteByUserIdAndCustomTypeId(Long userId, Long customTypeId);
}
