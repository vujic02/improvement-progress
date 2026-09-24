package com.kaizen.daytask;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DayTaskRepository extends JpaRepository<DayTask, Long> {

    /** Every read is one account over a date range - a day, a week or a month. */
    List<DayTask> findByUserIdAndLoggedOnBetweenOrderByLoggedOnAscIdAsc(Long userId, LocalDate from, LocalDate to);

    Optional<DayTask> findByIdAndUserId(Long id, Long userId);

    /** Deleting a custom task type takes the tasks logged against it. */
    void deleteByUserIdAndCustomTypeId(Long userId, Long customTypeId);
}
