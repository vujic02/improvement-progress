package com.kaizen.tasktype;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The parts of the frontend's `src/data/taskTypes.ts` this side has to know
 * about, and no more.
 *
 * <ul>
 * <li>{@code DEFAULT_LABELS} — the 12 built-in types. They are not rows: they
 * ship with the app and cannot be renamed or removed. They are listed here
 * only because a custom name has to be unique across defaults and custom types
 * together, and this side is where that is decided.
 * <li>{@code CUSTOM_COLORS} — there is no colour picker yet, so each new custom
 * type takes the next colour and wraps around. Assigning it is the store's job,
 * and the store is now here.
 * </ul>
 *
 * <p>Both lists must stay in step with the frontend's.
 */
public final class TaskTypeDefaults {

    /** Names are capped at this length, here and on the create form. */
    public static final int NAME_MAX = 30;

    /** How many types a user may add on top of the 12 defaults. */
    public static final int CUSTOM_LIMIT = 10;

    public static final List<String> DEFAULT_LABELS = List.of(
            "Deep work",
            "Gym / movement",
            "Learning",
            "Money / admin",
            "Chores / errands",
            "Mindset check-in",
            "Nutrition",
            "Sleep / recovery",
            "Social / family",
            "Creative / side project",
            "Health / medical",
            "Planning / review");

    public static final List<String> CUSTOM_COLORS = List.of(
            "#0075FF",
            "#01B574",
            "#582CFF",
            "#F79E1B",
            "#2CD9FF",
            "#4FD1C5",
            "#A3E635",
            "#9F7AEA",
            "#E5399E",
            "#FFB547");

    private static final Set<String> DEFAULT_LABELS_LOWER = DEFAULT_LABELS.stream()
            .map(label -> label.toLowerCase(Locale.ROOT))
            .collect(Collectors.toUnmodifiableSet());

    public static boolean isDefaultLabel(String label) {
        return DEFAULT_LABELS_LOWER.contains(label.toLowerCase(Locale.ROOT));
    }

    private TaskTypeDefaults() {
    }
}
