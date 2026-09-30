package com.kaizen.routine.dto;

import java.util.List;

/**
 * The whole routine form, for create and edit alike. Which schedule fields are
 * read depends on {@code cadence}; the service decides and names what is
 * missing, so the cadence is a plain string here.
 *
 * @param typeId     a built-in's key ("deep") or a custom type's id ("7")
 * @param cadence    daily, weekly, month-first, month-last, month-day,
 *                   every-n-days or every-n-weeks
 * @param weekdays   0-6, Sunday first. Weekly and every-n-weeks.
 * @param dayOfMonth 1-31. Month-day only.
 * @param interval   every-n-days (2-365) and every-n-weeks (2-52).
 */
public record RoutineRequest(
        String label,
        String typeId,
        String cadence,
        List<Integer> weekdays,
        Integer dayOfMonth,
        Integer interval) {
}
