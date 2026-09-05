package com.kaizen.profile.dto;

import java.util.List;

/**
 * Everything the profile page reads. `channels` is nested to match the
 * client's `DeliveryChannels`.
 */
public record ProfileResponse(
        boolean keepSignedIn,
        boolean paused,
        Channels channels,
        List<ReminderResponse> reminders) {

    public record Channels(boolean push, boolean email) {
    }
}
