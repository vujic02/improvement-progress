package com.kaizen.daytask.dto;

import java.time.LocalDate;

import com.kaizen.daytask.DayTask;

/** Shaped like the client's `DayTask`. `typeId` matches a `TaskType.id` there. */
public record DayTaskResponse(String id, String typeId, String label, LocalDate day, boolean done) {

    public static DayTaskResponse of(DayTask task) {
        return new DayTaskResponse(String.valueOf(task.getId()), task.getTypeId(), task.getLabel(),
                task.getLoggedOn(), task.isDone());
    }
}
