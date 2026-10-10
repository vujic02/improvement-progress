package com.kaizen.routine.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.kaizen.routine.Routine;
import com.kaizen.routine.RoutineCadence;

/**
 * Shaped like the client's `Routine`. Fields a cadence does not use are null
 * and dropped from the body.
 */
public record RoutineResponse(
        String id,
        String typeId,
        String label,
        RoutineCadence cadence,
        List<Integer> weekdays,
        Integer dayOfMonth,
        Integer interval,
        LocalDate startsOn,
        String pursuitId,
        BigDecimal amount) {

    public static RoutineResponse of(Routine routine) {
        RoutineCadence cadence = routine.getCadence();
        List<Integer> days = null;
        if (cadence.usesWeekdays()) {
            days = new ArrayList<>();
            for (int day = 0; day < 7; day++) {
                if ((routine.getWeekdays() & (1 << day)) != 0) {
                    days.add(day);
                }
            }
        }
        return new RoutineResponse(
                String.valueOf(routine.getId()),
                routine.getTypeId(),
                routine.getLabel(),
                cadence,
                days,
                cadence == RoutineCadence.MONTH_DAY ? routine.getDayOfMonth() : null,
                cadence.usesInterval() ? routine.getInterval() : null,
                routine.getStartsOn(),
                routine.getPursuitId() == null ? null : String.valueOf(routine.getPursuitId()),
                routine.getAmount());
    }
}
