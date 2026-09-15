package com.kaizen.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Counts attempts per key inside a fixed window and says how long a key that
 * has used them all must wait. Held in memory, so it is per server instance
 * and forgotten on restart — enough for one instance; several behind a load
 * balancer would need a shared store. Checking and recording are separate
 * steps, so a burst of simultaneous attempts can overshoot the limit by a few.
 */
public class AttemptLimiter {

    /** Past this many tracked keys, ended windows are swept on the next write. */
    private static final int SWEEP_THRESHOLD = 10_000;

    private record Window(Instant start, int count) {
    }

    private final int max;
    private final Duration period;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public AttemptLimiter(int max, Duration period, Clock clock) {
        this.max = max;
        this.period = period;
        this.clock = clock;
    }

    /** Seconds until {@code key} may try again, or 0 when it may try now. */
    public long secondsUntilAllowed(String key) {
        Window window = windows.get(key);
        if (window == null) {
            return 0;
        }

        Instant now = clock.instant();
        Instant end = window.start().plus(period);
        if (!now.isBefore(end)) {
            windows.remove(key, window);
            return 0;
        }
        if (window.count() < max) {
            return 0;
        }
        // Rounded up, so a key that is still blocked never hears "0 seconds".
        return (Duration.between(now, end).toMillis() + 999) / 1000;
    }

    /** Counts one attempt against {@code key}, opening a fresh window if the last one has ended. */
    public void record(String key) {
        Instant now = clock.instant();
        windows.compute(key, (k, window) -> window == null || !now.isBefore(window.start().plus(period))
                ? new Window(now, 1)
                : new Window(window.start(), window.count() + 1));

        if (windows.size() > SWEEP_THRESHOLD) {
            windows.values().removeIf(window -> !now.isBefore(window.start().plus(period)));
        }
    }

    /** Forgets {@code key} — once a sign-in succeeds, its earlier failures stop counting. */
    public void reset(String key) {
        windows.remove(key);
    }
}
