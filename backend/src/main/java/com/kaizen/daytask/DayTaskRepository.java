package com.kaizen.daytask;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DayTaskRepository extends JpaRepository<DayTask, Long> {

    /** Every read is one account over a date range - a day, a week or a month. */
    List<DayTask> findByUserIdAndLoggedOnBetweenOrderByLoggedOnAscIdAsc(Long userId, LocalDate from, LocalDate to);

    Optional<DayTask> findByIdAndUserId(Long id, Long userId);

    /** A routine's copy on one day - at most one, since each day is filled once. */
    Optional<DayTask> findFirstByRoutineIdAndLoggedOn(Long routineId, LocalDate loggedOn);

    /**
     * A deleted routine's past copies stay as plain tasks. The schema does this
     * with ON DELETE SET NULL; this makes it true where the schema comes from
     * the entities instead.
     */
    @Modifying
    @Query("update DayTask t set t.routineId = null where t.routineId = :routineId")
    void detachFromRoutine(@Param("routineId") Long routineId);

    /** A routine's copies over a span - what its goal's consistency record is counted from. */
    List<DayTask> findByRoutineIdAndLoggedOnBetween(Long routineId, LocalDate from, LocalDate to);

    /** A removed payment step can no longer be unticked through the copy that paid it. */
    @Modifying
    @Query("update DayTask t set t.paidStepId = null where t.paidStepId = :stepId")
    void forgetPaidStep(@Param("stepId") Long stepId);

    /** Deleting a custom task type takes the tasks logged against it. */
    void deleteByUserIdAndCustomTypeId(Long userId, Long customTypeId);
}
