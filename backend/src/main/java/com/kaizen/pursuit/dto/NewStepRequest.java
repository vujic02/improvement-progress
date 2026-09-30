package com.kaizen.pursuit.dto;

import java.math.BigDecimal;

/**
 * A worded step for growth and dreams ({@code label}), or payments for a money
 * area ({@code amount}, repeated {@code count} times - 500 x 12 lays out a
 * year). Which one is allowed depends on the area, and the service decides.
 *
 * @param count how many identical payments to add. Omitted means one.
 */
public record NewStepRequest(String label, BigDecimal amount, Integer count) {
}
