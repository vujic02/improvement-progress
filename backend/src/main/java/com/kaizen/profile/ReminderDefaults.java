package com.kaizen.profile;

import java.time.LocalTime;
import java.util.List;

/**
 * The eight reminders every account starts with, matching `DEFAULT_REMINDERS`
 * in the frontend one for one. Only the settings live here — the copy, icon
 * and colour stay on the client, and `key` is what joins the two halves.
 *
 * <p>Event-driven reminders ("Streak at risk", "Security alerts") have no
 * schedule; they still carry the base values so the columns are never null and
 * a reminder that later becomes scheduled has something to start from.
 *
 * <p>Adding one here means adding it to the frontend list too — a key with no
 * metadata renders nothing.
 */
public final class ReminderDefaults {

    public record Default(String key, boolean enabled, Cadence cadence, int weekday, int dayOfMonth, LocalTime time) {
    }

    private static final Cadence BASE_CADENCE = Cadence.MONTHLY;
    private static final int BASE_WEEKDAY = 0;
    private static final int BASE_DAY_OF_MONTH = 1;
    private static final LocalTime BASE_TIME = LocalTime.of(9, 0);

    public static final List<Default> ALL = List.of(
            new Default("investment-review", true, Cadence.MONTHLY, BASE_WEEKDAY, 1, LocalTime.of(9, 0)),
            new Default("savings-topup", true, Cadence.MONTHLY, BASE_WEEKDAY, 25, LocalTime.of(10, 0)),
            new Default("goal-deadline", true, BASE_CADENCE, BASE_WEEKDAY, BASE_DAY_OF_MONTH, BASE_TIME),
            new Default("daily-check", true, Cadence.DAILY, BASE_WEEKDAY, BASE_DAY_OF_MONTH, LocalTime.of(20, 0)),
            new Default("weekly-review", true, Cadence.WEEKLY, 0, BASE_DAY_OF_MONTH, LocalTime.of(18, 0)),
            new Default("streak-risk", false, BASE_CADENCE, BASE_WEEKDAY, BASE_DAY_OF_MONTH, BASE_TIME),
            new Default("product-updates", false, BASE_CADENCE, BASE_WEEKDAY, BASE_DAY_OF_MONTH, BASE_TIME),
            new Default("security-alerts", true, BASE_CADENCE, BASE_WEEKDAY, BASE_DAY_OF_MONTH, BASE_TIME));

    private ReminderDefaults() {
    }
}
