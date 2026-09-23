package com.kaizen.daytask.dto;

/**
 * @param done  the state to set. Omit it to flip whatever the task is on now,
 *              which is what a checkbox wants.
 * @param label a new label, or null to leave it alone.
 */
public record UpdateDayTaskRequest(Boolean done, String label) {
}
