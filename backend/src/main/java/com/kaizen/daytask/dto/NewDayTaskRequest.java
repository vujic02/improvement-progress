package com.kaizen.daytask.dto;

import java.time.LocalDate;

import com.kaizen.daytask.DayTask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * @param day    the day it counts towards, yyyy-mm-dd
 * @param typeId a built-in's key ("deep") or a custom type's id ("7")
 */
public record NewDayTaskRequest(
        @NotNull(message = "Say which day it belongs to.")
        LocalDate day,
        @NotBlank(message = "Pick a task type.")
        String typeId,
        @NotBlank(message = "Describe the task first.")
        @Size(max = DayTask.LABEL_MAX, message = "Keep it to " + DayTask.LABEL_MAX + " characters.")
        String label) {
}
