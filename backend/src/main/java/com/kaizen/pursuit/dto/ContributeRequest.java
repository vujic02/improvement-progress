package com.kaizen.pursuit.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

/**
 * A delta, not a new balance — that is what the card's field means. A negative
 * corrects a mistake, and the balance clamps at zero either way, so there is
 * no way to end up owing your own savings goal.
 */
public record ContributeRequest(@NotNull(message = "Enter an amount.") BigDecimal amount) {
}
