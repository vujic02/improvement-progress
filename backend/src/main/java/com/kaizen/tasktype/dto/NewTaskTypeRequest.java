package com.kaizen.tasktype.dto;

import com.kaizen.tasktype.TaskTypeDefaults;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A custom type is an icon plus a name. Nothing else, for now — the colour is
 * assigned server-side because there is no picker yet.
 */
public record NewTaskTypeRequest(
        @NotBlank(message = "Give the type a name.")
        @Size(max = TaskTypeDefaults.NAME_MAX,
                message = "Keep it to " + TaskTypeDefaults.NAME_MAX + " characters.")
        String label,

        @NotBlank(message = "Pick an icon.")
        @Size(max = 40, message = "That is not one of the icons.")
        String icon) {
}
