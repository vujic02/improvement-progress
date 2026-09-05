package com.kaizen.profile.dto;

import com.kaizen.profile.Cadence;

/**
 * A patch on one reminder. Same rule as the profile one: absent means leave it,
 * which is why the primitives are boxed.
 *
 * @param time 24-hour "HH:MM".
 */
public record UpdateReminderRequest(
        Boolean enabled,
        Cadence cadence,
        Integer weekday,
        Integer dayOfMonth,
        String time) {
}
