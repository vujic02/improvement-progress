package com.kaizen.profile.dto;

/**
 * A patch: every field is optional and only the ones present are written.
 * Boxed on purpose — `false` and "not sent" are different answers.
 */
public record UpdateProfileRequest(Boolean keepSignedIn, Boolean paused, Boolean push, Boolean email) {
}
