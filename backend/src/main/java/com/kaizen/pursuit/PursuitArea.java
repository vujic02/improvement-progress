package com.kaizen.pursuit;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Which page a pursuit belongs to. One table holds all three; this is what
 * keeps the lists apart, the way a separate context object does on the client.
 *
 * <p>The kind sets mirror `SAVINGS_KINDS` and `GROWTH_KINDS` in the frontend.
 * They are closed lists on purpose — a savings kind is also a card on the
 * stats row, so a fifth one has to earn its place — and a write API is where
 * "closed" has to actually mean something.
 */
public enum PursuitArea {

    /** Money, no kind-less entries, and no steps rendered on the card. */
    SAVINGS("savings", Set.of("saving", "investment", "debt", "bills"), true),

    GROWTH("growth",
            Set.of("learning", "training", "nutrition", "reading", "mind", "creative", "career", "social", "health"),
            false),

    /**
     * No kinds at all — a dream house and a dream sabbatical are not usefully
     * different categories. What distinguishes a dream is the picture of it,
     * so these carry an icon and optionally an image instead.
     */
    DREAMS("dreams", Set.of(), false);

    private final String wire;
    private final Set<String> kinds;
    private final boolean money;

    PursuitArea(String wire, Set<String> kinds, boolean money) {
        this.wire = wire;
        this.kinds = kinds;
        this.money = money;
    }

    @JsonValue
    public String wire() {
        return wire;
    }

    public Set<String> kinds() {
        return kinds;
    }

    /** Only money areas accept a target amount and contributions. */
    public boolean isMoney() {
        return money;
    }

    /** Areas with no kinds identify a pursuit by its icon instead. */
    public boolean hasKinds() {
        return !kinds.isEmpty();
    }

    @JsonCreator
    public static PursuitArea from(String value) {
        if (value != null) {
            for (PursuitArea area : values()) {
                if (area.wire.equalsIgnoreCase(value.trim())) {
                    return area;
                }
            }
        }
        throw new IllegalArgumentException("'" + value + "' is not a pursuit area.");
    }
}
