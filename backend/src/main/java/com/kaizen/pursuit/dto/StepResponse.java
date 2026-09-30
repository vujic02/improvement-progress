package com.kaizen.pursuit.dto;

import java.math.BigDecimal;

import com.kaizen.pursuit.PursuitStep;

/** Exactly one of {@code label} and {@code amount} is set; the null one is dropped from the body. */
public record StepResponse(String id, String label, BigDecimal amount, boolean done) {

    public static StepResponse of(PursuitStep step) {
        return new StepResponse(String.valueOf(step.getId()), step.getLabel(), step.getAmount(), step.isDone());
    }
}
