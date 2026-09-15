package com.kaizen.profile;

import java.util.Locale;

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
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static Cadence from(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Pick a cadence.");
        }
        try {
            // Locale.ROOT: under a Turkish default locale "daily" would upper-case to "DAİLY".
            return Cadence.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("'" + value + "' is not a cadence.");
        }
    }
}
