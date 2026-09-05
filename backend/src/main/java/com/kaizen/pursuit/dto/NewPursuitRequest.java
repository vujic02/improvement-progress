package com.kaizen.pursuit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.kaizen.pursuit.Pursuit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the create modal sends. Which of the optional fields are allowed
 * depends on the area, and the service is what decides that.
 *
 * @param image     raw, as typed. Normalised and rejected unless https.
 * @param createdAt yyyy-mm-dd. The start date, which may be back-dated.
 */
public record NewPursuitRequest(
        @NotBlank(message = "Give it a name.")
        @Size(max = Pursuit.NAME_MAX, message = "Keep the name to " + Pursuit.NAME_MAX + " characters.")
        String name,

        String kind,
        String icon,
        String image,
        BigDecimal target,
        BigDecimal saved,

        @NotNull(message = "Pick a start date.") LocalDate createdAt,
        @NotNull(message = "Pick a target date.") LocalDate targetAt) {
}
