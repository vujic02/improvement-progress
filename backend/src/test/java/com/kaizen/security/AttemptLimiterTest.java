package com.kaizen.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

class AttemptLimiterTest {

    /** A clock the test moves by hand, so no test waits out a real window. */
    private static final class ManualClock extends Clock {

        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        void advance(Duration by) {
            now = now.plus(by);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }

    private final ManualClock clock = new ManualClock();
    private final AttemptLimiter limiter = new AttemptLimiter(3, Duration.ofMinutes(15), clock);

    @Test
    void allowsUpToTheLimitThenMakesTheKeyWaitOutTheWindow() {
        for (int attempt = 0; attempt < 3; attempt++) {
            assertThat(limiter.secondsUntilAllowed("key")).isZero();
            limiter.record("key");
        }

        assertThat(limiter.secondsUntilAllowed("key")).isEqualTo(15 * 60);
    }

    @Test
    void theWaitEndsWithTheWindowAndIsNeverRoundedDownToZero() {
        recordThree("key");

        clock.advance(Duration.ofMinutes(15).minusMillis(999));
        assertThat(limiter.secondsUntilAllowed("key")).isEqualTo(1);

        clock.advance(Duration.ofMillis(999));
        assertThat(limiter.secondsUntilAllowed("key")).isZero();
    }

    @Test
    void anAttemptAfterTheWindowStartsAFreshCount() {
        recordThree("key");
        clock.advance(Duration.ofMinutes(15));

        limiter.record("key");

        assertThat(limiter.secondsUntilAllowed("key")).isZero();
    }

    @Test
    void keysAreCountedSeparately() {
        recordThree("one");

        assertThat(limiter.secondsUntilAllowed("other")).isZero();
    }

    @Test
    void resetForgetsTheKey() {
        recordThree("key");

        limiter.reset("key");

        assertThat(limiter.secondsUntilAllowed("key")).isZero();
    }

    private void recordThree(String key) {
        for (int attempt = 0; attempt < 3; attempt++) {
            limiter.record(key);
        }
    }
}
