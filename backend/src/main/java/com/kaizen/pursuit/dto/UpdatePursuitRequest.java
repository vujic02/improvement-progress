package com.kaizen.pursuit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.kaizen.pursuit.Pursuit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * What the edit modal sends: the whole form, not a diff. A blank optional
 * field clears it, so removing a picture or a target is the same request as
 * changing one.
 *
 * <p>There is no area — a goal does not move between pages — and no balance:
 * that only moves through contributions, so an edit cannot quietly rewrite
 * how much has gone in.
 *
 * @param image     raw, as typed. Normalised and rejected unless https.
 * @param createdAt yyyy-mm-dd. The start date, which may be back-dated.
 */
public record UpdatePursuitRequest(
        @NotBlank(message = "Give it a name.")
        @Size(max = Pursuit.NAME_MAX, message = "Keep the name to " + Pursuit.NAME_MAX + " characters.")
        String name,

        String kind,
        String icon,
        String image,
        BigDecimal target,

        @NotNull(message = "Pick a start date.") LocalDate createdAt,
        @NotNull(message = "Pick a target date.") LocalDate targetAt) {
}
