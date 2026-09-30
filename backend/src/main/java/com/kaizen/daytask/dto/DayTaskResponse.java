package com.kaizen.daytask.dto;

import java.time.LocalDate;

import com.kaizen.daytask.DayTask;

/**
 * Shaped like the client's `DayTask`. `typeId` matches a `TaskType.id` there.
 *
 * @param routineId the routine it was filled in from; absent for a task added by hand
 */
public record DayTaskResponse(String id, String typeId, String label, LocalDate day, boolean done,
        String routineId) {

    public static DayTaskResponse of(DayTask task) {
        return new DayTaskResponse(String.valueOf(task.getId()), task.getTypeId(), task.getLabel(),
                task.getLoggedOn(), task.isDone(),
                task.getRoutineId() == null ? null : String.valueOf(task.getRoutineId()));
    }
}
