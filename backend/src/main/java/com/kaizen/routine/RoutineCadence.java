package com.kaizen.routine;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** How often a routine runs. The wire names are what the client's picker uses. */
public enum RoutineCadence {

    DAILY("daily"),
    /** On the chosen weekdays. */
    WEEKLY("weekly"),
    MONTH_FIRST("month-first"),
    MONTH_LAST("month-last"),
    /** On one day of the month; the 31st falls back to the last day in short months. */
    MONTH_DAY("month-day"),
    /** Every n days, counted from the start date. */
    EVERY_N_DAYS("every-n-days"),
    /** On the chosen weekdays, every n weeks, counted from the start date's week. */
    EVERY_N_WEEKS("every-n-weeks");

    private final String wire;

    RoutineCadence(String wire) {
        this.wire = wire;
    }

    @JsonValue
    public String wire() {
        return wire;
    }

    /** Uses weekdays - both kinds of week schedule. */
    public boolean usesWeekdays() {
        return this == WEEKLY || this == EVERY_N_WEEKS;
    }

    /** Uses an interval - the two every-n schedules. */
    public boolean usesInterval() {
        return this == EVERY_N_DAYS || this == EVERY_N_WEEKS;
    }

    @JsonCreator
    public static RoutineCadence from(String value) {
        if (value != null) {
            for (RoutineCadence cadence : values()) {
                if (cadence.wire.equalsIgnoreCase(value.trim())) {
                    return cadence;
                }
            }
        }
        throw new IllegalArgumentException("'" + value + "' is not a schedule.");
    }
}
