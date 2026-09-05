package com.kaizen.pursuit.dto;

/**
 * @param done the state to set. Omit it to flip whatever the step is on now,
 *             which is what the card's checkbox wants.
 */
public record UpdateStepRequest(Boolean done) {
}
