package com.kaizen.routine;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.daytask.DayTask;
import com.kaizen.daytask.DayTaskRepository;
import com.kaizen.routine.dto.RoutineRequest;
import com.kaizen.routine.dto.RoutineResponse;
import com.kaizen.tasktype.TaskTypeResolver;

/**
 * Recurring tasks. A routine is only a template; the days it runs on get
 * ordinary day tasks, filled in by {@link #materialize} whenever the account's
 * days are read. Everything that scores a day reads those rows and never needs
 * to know a routine exists.
 */
@Service
public class RoutineService {

    /** A long break fills at most this far back - a gap, not a flood. */
    static final int BACKFILL_DAYS = 62;

    /** Per account. A routine is a habit; fifty of them is a to-do list. */
    static final int ROUTINES_MAX = 50;

    static final int DAYS_INTERVAL_MAX = 365;

    static final int WEEKS_INTERVAL_MAX = 52;

    private final RoutineRepository repo;
    private final DayTaskRepository dayTasks;
    private final TaskTypeResolver types;

    public RoutineService(RoutineRepository repo, DayTaskRepository dayTasks, TaskTypeResolver types) {
        this.repo = repo;
        this.dayTasks = dayTasks;
        this.types = types;
    }

    /**
     * The day turns over where the user is, not where the server is, so the
     * client says which day is today. Anything more than a day off the
     * server's clock is not a timezone - it is a wrong clock or a forged
     * request - and is refused. No value means the server's today.
     */
    public static LocalDate clientToday(LocalDate requested) {
        LocalDate server = LocalDate.now();
        if (requested == null) {
            return server;
        }
        if (Math.abs(ChronoUnit.DAYS.between(server, requested)) > 1) {
            throw ApiException.badRequest("Your device's date looks wrong.");
        }
        return requested;
    }

    @Transactional(readOnly = true)
    public List<RoutineResponse> list(Long userId) {
        return repo.findByUserIdOrderByIdAsc(userId).stream().map(RoutineResponse::of).toList();
    }

    /** Starts today. Today's copy appears on the next read of the days, if the schedule includes today. */
    @Transactional
    public RoutineResponse add(Long userId, RoutineRequest request, LocalDate today) {
        if (repo.countByUserId(userId) >= ROUTINES_MAX) {
            throw ApiException.conflict("You can keep " + ROUTINES_MAX + " recurring tasks. Remove one first.");
        }
        Routine routine = new Routine(userId, clientToday(today));
        apply(routine, userId, request);
        return RoutineResponse.of(repo.save(routine));
    }

    /**
     * Past days keep what they had. Today's copy follows the edit if it is
     * untouched - not ticked, not renamed - and goes if the new schedule no
     * longer includes today. A touched copy is the user's and stays as it is.
     */
    @Transactional
    public RoutineResponse update(Long userId, Long id, RoutineRequest request, LocalDate today) {
        Routine routine = require(userId, id);
        apply(routine, userId, request);

        LocalDate day = clientToday(today);
        dayTasks.findFirstByRoutineIdAndLoggedOn(id, day)
                .filter(DayTask::isUntouched)
                .ifPresent(copy -> {
                    if (routine.runsOn(day)) {
                        copy.setLabel(routine.getLabel());
                        if (routine.getCustomTypeId() != null) {
                            copy.setCustomTypeId(routine.getCustomTypeId());
                        } else {
                            copy.setDefaultKey(routine.getDefaultKey());
                        }
                    } else {
                        dayTasks.delete(copy);
                    }
                });
        return RoutineResponse.of(routine);
    }

    /**
     * Today's copy goes with it if untouched. Every other copy stays as a
     * plain task - the days already happened.
     */
    @Transactional
    public void remove(Long userId, Long id, LocalDate today) {
        Routine routine = require(userId, id);
        dayTasks.findFirstByRoutineIdAndLoggedOn(id, clientToday(today))
                .filter(DayTask::isUntouched)
                .ifPresent(dayTasks::delete);
        dayTasks.detachFromRoutine(id);
        repo.delete(routine);
    }

    /**
     * Gives every day from the last fill up to {@code today} its copies,
     * unticked - including days the app was never opened on, so a missed day
     * shows as a gap rather than as nothing planned. Each day is filled once:
     * a copy deleted by hand is not put back. Future days are never filled.
     */
    @Transactional
    public void materialize(Long userId, LocalDate today) {
        LocalDate earliest = today.minusDays(BACKFILL_DAYS - 1L);
        for (Routine routine : repo.findByUserIdOrderByIdAsc(userId)) {
            LocalDate from = routine.getStartsOn();
            if (routine.getGeneratedThrough() != null && !routine.getGeneratedThrough().isBefore(from)) {
                from = routine.getGeneratedThrough().plusDays(1);
            }
            if (from.isBefore(earliest)) {
                from = earliest;
            }
            if (from.isAfter(today)) {
                continue;
            }

            for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
                if (routine.runsOn(day)) {
                    DayTask copy = new DayTask(userId, routine.getLabel(), day);
                    if (routine.getCustomTypeId() != null) {
                        copy.setCustomTypeId(routine.getCustomTypeId());
                    } else {
                        copy.setDefaultKey(routine.getDefaultKey());
                    }
                    copy.setRoutineId(routine.getId());
                    dayTasks.save(copy);
                }
            }
            routine.setGeneratedThrough(today);
        }
    }

    private Routine require(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No such recurring task."));
    }

    /** Checks the whole form before writing any of it. */
    private void apply(Routine routine, Long userId, RoutineRequest request) {
        String label = request.label() == null ? "" : request.label().trim();
        if (label.isEmpty()) {
            throw ApiException.badRequest("Describe the task first.");
        }
        if (label.length() > DayTask.LABEL_MAX) {
            throw ApiException.badRequest("Keep it to " + DayTask.LABEL_MAX + " characters.");
        }
        TaskTypeResolver.Ref type = types.resolve(userId, request.typeId());

        RoutineCadence cadence;
        try {
            cadence = RoutineCadence.from(request.cadence());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Pick how often it repeats.");
        }

        int weekdays = 0;
        if (cadence.usesWeekdays()) {
            if (request.weekdays() == null || request.weekdays().isEmpty()) {
                throw ApiException.badRequest("Pick at least one day of the week.");
            }
            for (Integer day : request.weekdays()) {
                if (day == null || day < 0 || day > 6) {
                    throw ApiException.badRequest("Days of the week run from 0 (Sunday) to 6 (Saturday).");
                }
                weekdays |= 1 << day;
            }
        }

        Integer dayOfMonth = null;
        if (cadence == RoutineCadence.MONTH_DAY) {
            dayOfMonth = request.dayOfMonth();
            if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) {
                throw ApiException.badRequest("Pick a day of the month from 1 to 31.");
            }
        }

        Integer interval = null;
        if (cadence.usesInterval()) {
            interval = request.interval();
            int max = cadence == RoutineCadence.EVERY_N_DAYS ? DAYS_INTERVAL_MAX : WEEKS_INTERVAL_MAX;
            String unit = cadence == RoutineCadence.EVERY_N_DAYS ? "days" : "weeks";
            if (interval == null || interval < 2 || interval > max) {
                throw ApiException.badRequest("Repeat every 2 to " + max + " " + unit + ".");
            }
        }

        routine.setLabel(label);
        routine.setType(type.customTypeId(), type.defaultKey());
        routine.setSchedule(cadence, weekdays, dayOfMonth, interval);
    }
}
