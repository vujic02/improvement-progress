package com.kaizen.routine.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One day's copy of a linked recurring task, as its goal lists it among the
 * steps. Ticked through the day task it is, not through the goal.
 *
 * @param id     the day task's id
 * @param amount money goals only: what ticking it adds, or added
 */
public record RunResponse(
        String id,
        String routineId,
        String label,
        LocalDate day,
        boolean done,
        BigDecimal amount) {
}
