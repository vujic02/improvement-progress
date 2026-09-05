package com.kaizen.tasktype.dto;

import com.kaizen.tasktype.CustomTaskType;

/**
 * Shaped like the client's `TaskType`. {@code custom} is always true here —
 * the defaults never come from this endpoint.
 */
public record TaskTypeResponse(String id, String label, String color, String icon, boolean custom) {

    public static TaskTypeResponse of(CustomTaskType type) {
        return new TaskTypeResponse(String.valueOf(type.getId()), type.getLabel(), type.getColor(), type.getIcon(),
                true);
    }
}
