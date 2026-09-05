package com.kaizen.pursuit.dto;

import com.kaizen.pursuit.PursuitStep;

public record StepResponse(String id, String label, boolean done) {

    public static StepResponse of(PursuitStep step) {
        return new StepResponse(String.valueOf(step.getId()), step.getLabel(), step.isDone());
    }
}
