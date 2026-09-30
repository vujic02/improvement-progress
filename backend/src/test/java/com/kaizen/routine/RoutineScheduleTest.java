package com.kaizen.routine;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/** Which days each schedule lands on. No Spring - just the calendar. */
class RoutineScheduleTest {

    /** A Wednesday. */
    private static final LocalDate START = LocalDate.of(2026, 1, 7);

    @Test
    void dailyRunsEveryDayFromItsStartButNotBefore() {
        Routine routine = routine(RoutineCadence.DAILY, 0, null, null);

        assertThat(routine.runsOn(START.minusDays(1))).isFalse();
        assertThat(days(routine, START, 5)).hasSize(5);
    }

    @Test
    void weeklyRunsOnTheChosenWeekdaysOnly() {
        // Monday, Wednesday, Friday: bits 1, 3 and 5.
        Routine routine = routine(RoutineCadence.WEEKLY, (1 << 1) | (1 << 3) | (1 << 5), null, null);

        assertThat(days(routine, START, 7)).containsExactly(
                LocalDate.of(2026, 1, 7), LocalDate.of(2026, 1, 9), LocalDate.of(2026, 1, 12));
    }

    @Test
    void theMonthEndsLandOnTheFirstAndTheLastDay() {
        Routine first = routine(RoutineCadence.MONTH_FIRST, 0, null, null);
        Routine last = routine(RoutineCadence.MONTH_LAST, 0, null, null);

        assertThat(days(first, START, 60)).containsExactly(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1));
        assertThat(days(last, START, 60)).containsExactly(LocalDate.of(2026, 1, 31), LocalDate.of(2026, 2, 28));
    }

    @Test
    void theThirtyFirstFallsBackToTheLastDayOfAShortMonth() {
        Routine routine = routine(RoutineCadence.MONTH_DAY, 0, 31, null);

        assertThat(days(routine, START, 90)).containsExactly(
                LocalDate.of(2026, 1, 31), LocalDate.of(2026, 2, 28), LocalDate.of(2026, 3, 31));
    }

    @Test
    void everyNDaysCountsFromTheStart() {
        Routine routine = routine(RoutineCadence.EVERY_N_DAYS, 0, null, 3);

        assertThat(days(routine, START, 10)).containsExactly(
                START, START.plusDays(3), START.plusDays(6), START.plusDays(9));
    }

    @Test
    void everyNWeeksRunsOnItsWeekdaysInEveryNthWeekOnly() {
        // Sundays, every other week. The start's own week (from Sunday 4 Jan)
        // counts as week zero, so the first run is 4 Jan's week - already past.
        Routine routine = routine(RoutineCadence.EVERY_N_WEEKS, 1, null, 2);

        assertThat(days(routine, START, 35)).containsExactly(
                LocalDate.of(2026, 1, 18), LocalDate.of(2026, 2, 1));
    }

    private static Routine routine(RoutineCadence cadence, int weekdays, Integer dayOfMonth, Integer interval) {
        Routine routine = new Routine(1L, START);
        routine.setSchedule(cadence, weekdays, dayOfMonth, interval);
        return routine;
    }

    private static List<LocalDate> days(Routine routine, LocalDate from, int count) {
        return Stream.iterate(from, day -> day.plusDays(1)).limit(count).filter(routine::runsOn).toList();
    }
}
