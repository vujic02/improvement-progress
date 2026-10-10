package com.kaizen.daytask;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.daytask.dto.DayTaskResponse;
import com.kaizen.daytask.dto.NewDayTaskRequest;
import com.kaizen.daytask.dto.UpdateDayTaskRequest;
import com.kaizen.routine.GoalLinks;
import com.kaizen.routine.RoutineService;
import com.kaizen.tasktype.TaskTypeResolver;

/**
 * The day tracker's rules. A task belongs to one account, sits on one day, and
 * names one task type that account can actually use.
 */
@Service
public class DayTaskService {

    /** Nothing before the tracker existed, so a date this old is a typo. */
    static final LocalDate EARLIEST = LocalDate.of(2020, 1, 1);

    /** Planning a year out is fair; further is a paste accident. */
    static final int MAX_MONTHS_AHEAD = 12;

    /** A month view asks for 31 days, so a year of them is room enough. */
    static final int MAX_RANGE_DAYS = 366;

    private final DayTaskRepository repo;
    private final TaskTypeResolver types;
    private final RoutineService routines;
    private final GoalLinks links;

    public DayTaskService(DayTaskRepository repo, TaskTypeResolver types, RoutineService routines,
            GoalLinks links) {
        this.repo = repo;
        this.types = types;
        this.routines = routines;
        this.links = links;
    }

    /**
     * Fills in the account's routines up to {@code today} first, so a read is
     * always of the days as they should stand - including a day the app was
     * never opened on, which gets its copies unticked.
     *
     * @param today the client's today, since the day turns over where the user
     *              is; null falls back to the server's
     */
    @Transactional
    public List<DayTaskResponse> list(Long userId, LocalDate from, LocalDate to, LocalDate today) {
        if (to.isBefore(from)) {
            throw ApiException.badRequest("The range ends before it starts.");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw ApiException.badRequest("Ask for a year at a time at most.");
        }
        routines.materialize(userId, RoutineService.clientToday(today));
        return repo.findByUserIdAndLoggedOnBetweenOrderByLoggedOnAscIdAsc(userId, from, to).stream()
                .map(DayTaskResponse::of)
                .toList();
    }

    @Transactional
    public DayTaskResponse add(Long userId, NewDayTaskRequest request) {
        String label = label(request.label());
        LocalDate day = day(request.day());

        DayTask task = new DayTask(userId, label, day);
        applyType(task, userId, request.typeId());
        return DayTaskResponse.of(repo.save(task));
    }

    @Transactional
    public DayTaskResponse update(Long userId, Long id, UpdateDayTaskRequest request) {
        DayTask task = require(userId, id);
        // No `done` means flip it: that is what a checkbox sends.
        boolean done = request.done() != null ? request.done() : !task.isDone();
        // A copy of a routine linked to a money goal pays it, or refunds it.
        links.onTick(task, done);
        task.setDone(done);
        if (request.label() != null) {
            String label = label(request.label());
            if (!label.equals(task.getLabel())) {
                // Renamed by hand: the routine no longer speaks for this copy.
                task.setLabel(label);
                task.setEdited(true);
            }
        }
        return DayTaskResponse.of(repo.save(task));
    }

    @Transactional
    public void remove(Long userId, Long id) {
        repo.delete(require(userId, id));
    }

    private DayTask require(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No such task."));
    }

    private String label(String value) {
        String label = value == null ? "" : value.trim();
        if (label.isEmpty()) {
            throw ApiException.badRequest("Describe the task first.");
        }
        if (label.length() > DayTask.LABEL_MAX) {
            throw ApiException.badRequest("Keep it to " + DayTask.LABEL_MAX + " characters.");
        }
        return label;
    }

    private LocalDate day(LocalDate day) {
        if (day.isBefore(EARLIEST) || day.isAfter(LocalDate.now().plusMonths(MAX_MONTHS_AHEAD))) {
            throw ApiException.badRequest("That date is outside the tracker.");
        }
        return day;
    }

    private void applyType(DayTask task, Long userId, String typeId) {
        TaskTypeResolver.Ref ref = types.resolve(userId, typeId);
        if (ref.customTypeId() != null) {
            task.setCustomTypeId(ref.customTypeId());
        } else {
            task.setDefaultKey(ref.defaultKey());
        }
    }
}
