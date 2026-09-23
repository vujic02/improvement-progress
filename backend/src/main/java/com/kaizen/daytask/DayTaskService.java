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
import com.kaizen.tasktype.CustomTaskTypeRepository;
import com.kaizen.tasktype.TaskTypeDefaults;

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
    private final CustomTaskTypeRepository types;

    public DayTaskService(DayTaskRepository repo, CustomTaskTypeRepository types) {
        this.repo = repo;
        this.types = types;
    }

    @Transactional(readOnly = true)
    public List<DayTaskResponse> list(Long userId, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw ApiException.badRequest("The range ends before it starts.");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw ApiException.badRequest("Ask for a year at a time at most.");
        }
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
        task.setDone(request.done() != null ? request.done() : !task.isDone());
        if (request.label() != null) {
            task.setLabel(label(request.label()));
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

    /**
     * One string arrives from the client and lands in one of two columns: the
     * built-in key as it is, or the id of a custom type this account owns.
     * Anything else - another account's type, a deleted one, a typo - is a bad
     * request rather than a row pointing nowhere.
     */
    private void applyType(DayTask task, Long userId, String typeId) {
        String value = typeId.trim();
        if (TaskTypeDefaults.isDefaultKey(value)) {
            task.setDefaultKey(value);
            return;
        }

        long customId;
        try {
            customId = Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("No such task type.");
        }
        types.findByIdAndUserId(customId, userId)
                .orElseThrow(() -> ApiException.badRequest("No such task type."));
        task.setCustomTypeId(customId);
    }
}
