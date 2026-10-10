package com.kaizen.routine.dto;

import java.time.LocalDate;

/**
 * A recurring task as its goal shows it: the routine, and how it has gone.
 *
 * @param done       runs ticked in the last 30 days
 * @param due        runs in the last 30 days, ticked or not
 * @param streak     consecutive runs ticked, counting back; an unticked today does not break it
 * @param dueToday   today's copy exists and is not ticked yet
 * @param lastMissed the most recent past day left unticked, within the backfill window; null if none
 */
public record HabitResponse(
        RoutineResponse routine,
        int done,
        int due,
        int streak,
        boolean dueToday,
        LocalDate lastMissed) {
}
