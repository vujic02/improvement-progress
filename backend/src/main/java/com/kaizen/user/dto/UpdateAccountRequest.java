package com.kaizen.user.dto;

import com.kaizen.user.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
        @NotBlank(message = "Your name cannot be empty.")
        @Size(max = User.NAME_MAX, message = "That name is too long.")
        String name,

        @NotBlank(message = "Enter your email.")
        @Email(message = "That email doesn't look right.")
        @Size(max = 190, message = "That email is too long.")
        String email) {
}
