package com.kaizen.profile;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * How often a scheduled reminder fires. Serialised and stored lowercase, which
 * is what the client's `CADENCES` already speaks.
 */
public enum Cadence {
    DAILY,
    WEEKLY,
    MONTHLY;

    @JsonValue
    public String wire() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Cadence from(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Pick a cadence.");
        }
        try {
            return Cadence.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("'" + value + "' is not a cadence.");
        }
    }
}
