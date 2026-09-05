package com.kaizen.profile.dto;

import java.time.format.DateTimeFormatter;

import com.kaizen.profile.Cadence;
import com.kaizen.profile.Reminder;

/**
 * @param time 24-hour "HH:MM" — the value an {@code <input type="time">}
 *             speaks, and what the client's `Reminder.time` already holds.
 */
public record ReminderResponse(String id, boolean enabled, Cadence cadence, int weekday, int dayOfMonth, String time) {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    public static ReminderResponse of(Reminder reminder) {
        return new ReminderResponse(
                reminder.getKey(),
                reminder.isEnabled(),
                reminder.getCadence(),
                reminder.getWeekday(),
                reminder.getDayOfMonth(),
                reminder.getTime().format(HH_MM));
    }
}
