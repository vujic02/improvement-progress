package com.kaizen.pursuit.dto;

import com.kaizen.pursuit.PursuitStep;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewStepRequest(
        @NotBlank(message = "Describe the step first.")
        @Size(max = PursuitStep.LABEL_MAX, message = "Keep it to " + PursuitStep.LABEL_MAX + " characters.")
        String label) {
}
