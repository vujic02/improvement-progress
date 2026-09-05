package com.kaizen.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * The confirm field is checked on the client too, but it is re-checked here —
 * the same reason every other rule is.
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Enter your current password.") String current,
        @NotBlank(message = "Enter a new password.") String password,
        @NotBlank(message = "Confirm the new password.") String confirm) {
}
