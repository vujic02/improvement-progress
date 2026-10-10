package com.kaizen.routine;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.daytask.DayTask;
import com.kaizen.daytask.DayTaskRepository;
import com.kaizen.pursuit.Pursuit;
import com.kaizen.pursuit.PursuitRepository;
import com.kaizen.pursuit.PursuitStep;
import com.kaizen.routine.dto.HabitResponse;
import com.kaizen.routine.dto.RoutineResponse;
import com.kaizen.routine.dto.RunResponse;

/**
 * Where recurring tasks meet goals. A routine linked to a money goal pays it
 * when its day's copy is ticked; one linked to any goal shows up on that goal
 * as a habit with a consistency record, and its copies as steps to tick.
 *
 * <p>Depends on repositories only, so the day, pursuit and routine services
 * can all lean on it without leaning on each other.
 */
@Service
public class GoalLinks {

    /** The record a goal card shows: "24 of 30 days". */
    static final int RECORD_DAYS = 30;

    /** Ticked runs a goal still lists, per routine. Unticked ones are all listed. */
    static final int RECENT_RUNS = 3;

    /** What a goal's linked routines add to its response. */
    public record Linked(List<HabitResponse> habits, List<RunResponse> runs) {

        public static final Linked NONE = new Linked(List.of(), List.of());
    }

    private final RoutineRepository routines;
    private final DayTaskRepository dayTasks;
    private final PursuitRepository pursuits;

    public GoalLinks(RoutineRepository routines, DayTaskRepository dayTasks, PursuitRepository pursuits) {
        this.routines = routines;
        this.dayTasks = dayTasks;
        this.pursuits = pursuits;
    }

    /**
     * Called as a copy's done flag changes. Ticking a copy linked to a money
     * goal ticks that goal's next unpaid payment step - which moves the
     * balance - or, with none left, adds the routine's own amount. The copy
     * remembers which, so unticking undoes exactly that and nothing else.
     *
     * <p>Growth goals and dreams have nothing to pay; their link is read, not
     * written, by {@link #linksFor}.
     */
    @Transactional
    public void onTick(DayTask copy, boolean done) {
        if (done == copy.isDone() || copy.getRoutineId() == null) {
            return;
        }
        if (done) {
            linkedMoneyGoal(copy).ifPresent(link -> pay(copy, link.pursuit(), link.routine()));
        } else {
            refund(copy);
        }
    }

    private void pay(DayTask copy, Pursuit pursuit, Routine routine) {
        Optional<PursuitStep> next = pursuit.getSteps().stream()
                .filter(step -> step.getAmount() != null && !step.isDone())
                .findFirst();
        if (next.isPresent()) {
            PursuitStep step = next.get();
            step.setDone(true);
            move(pursuit, step.getAmount());
            copy.setPaidStepId(step.getId());
        } else if (routine.getAmount() != null) {
            move(pursuit, routine.getAmount());
            copy.setPaidAmount(routine.getAmount());
        }
    }

    private void refund(DayTask copy) {
        if (copy.getPaidStepId() == null && copy.getPaidAmount() == null) {
            return;
        }
        routines.findById(copy.getRoutineId())
                .map(Routine::getPursuitId)
                .flatMap(id -> pursuits.findByIdAndUserId(id, copy.getUserId()))
                .ifPresent(pursuit -> {
                    if (copy.getPaidStepId() != null) {
                        // Only if the step is still ticked - it may have been
                        // unticked on the goal card since.
                        pursuit.getSteps().stream()
                                .filter(step -> step.getId().equals(copy.getPaidStepId()) && step.isDone())
                                .findFirst()
                                .ifPresent(step -> {
                                    step.setDone(false);
                                    move(pursuit, step.getAmount().negate());
                                });
                    } else {
                        move(pursuit, copy.getPaidAmount().negate());
                    }
                });
        copy.setPaidStepId(null);
        copy.setPaidAmount(null);
    }

    /** The balance clamps at zero, as it does for every other way money moves. */
    private static void move(Pursuit pursuit, BigDecimal delta) {
        BigDecimal saved = pursuit.getSaved() == null ? BigDecimal.ZERO : pursuit.getSaved();
        pursuit.setSaved(saved.add(delta).max(BigDecimal.ZERO));
    }

    private record Link(Routine routine, Pursuit pursuit) {
    }

    private Optional<Link> linkedMoneyGoal(DayTask copy) {
        return routines.findById(copy.getRoutineId())
                .filter(routine -> routine.getPursuitId() != null)
                .flatMap(routine -> pursuits.findByIdAndUserId(routine.getPursuitId(), copy.getUserId())
                        .filter(pursuit -> pursuit.getArea().isMoney())
                        .map(pursuit -> new Link(routine, pursuit)));
    }

    /**
     * Every linked routine's record and runs, keyed by goal id. The record
     * counts the last {@value #RECORD_DAYS} days the routine ran on; the
     * streak counts back over consecutive runs ticked, and an unticked today
     * does not break it - the day is not over.
     *
     * <p>The runs are the copies a goal lists among its steps: every unticked
     * one, and the last {@value #RECENT_RUNS} ticked, so a daily task stays a
     * short list. A money goal lists only the runs that are a payment of
     * their own - a run that ticks a planned payment step is already on the
     * card as that step.
     */
    @Transactional(readOnly = true)
    public Map<Long, Linked> linksFor(Long userId, List<Pursuit> goals, LocalDate today) {
        Map<Long, Linked> byGoal = new HashMap<>();
        if (goals.isEmpty()) {
            return byGoal;
        }
        Map<Long, Pursuit> goalsById = goals.stream().collect(Collectors.toMap(Pursuit::getId, Function.identity()));
        List<Long> ids = goals.stream().map(Pursuit::getId).toList();
        LocalDate earliest = today.minusDays(RoutineService.BACKFILL_DAYS - 1L);

        for (Routine routine : routines.findByUserIdAndPursuitIdInOrderByIdAsc(userId, ids)) {
            List<DayTask> copies = new ArrayList<>(
                    dayTasks.findByRoutineIdAndLoggedOnBetween(routine.getId(), earliest, today));
            copies.sort(Comparator.comparing(DayTask::getLoggedOn).reversed());

            LocalDate recordFrom = today.minusDays(RECORD_DAYS - 1L);
            int due = 0;
            int done = 0;
            for (DayTask copy : copies) {
                if (!copy.getLoggedOn().isBefore(recordFrom)) {
                    due++;
                    if (copy.isDone()) {
                        done++;
                    }
                }
            }

            int streak = 0;
            for (DayTask copy : copies) {
                if (copy.isDone()) {
                    streak++;
                } else if (copy.getLoggedOn().equals(today)) {
                    continue;
                } else {
                    break;
                }
            }

            LocalDate lastMissed = copies.stream()
                    .filter(copy -> !copy.isDone() && copy.getLoggedOn().isBefore(today))
                    .map(DayTask::getLoggedOn)
                    .findFirst()
                    .orElse(null);
            boolean dueToday = copies.stream()
                    .anyMatch(copy -> copy.getLoggedOn().equals(today) && !copy.isDone());

            Pursuit goal = goalsById.get(routine.getPursuitId());
            boolean money = goal.getArea().isMoney();
            boolean stepLeft = goal.getSteps().stream()
                    .anyMatch(step -> step.getAmount() != null && !step.isDone());

            Linked linked = byGoal.computeIfAbsent(goal.getId(),
                    id -> new Linked(new ArrayList<>(), new ArrayList<>()));
            linked.habits()
                    .add(new HabitResponse(RoutineResponse.of(routine), done, due, streak, dueToday, lastMissed));

            int ticked = 0;
            for (DayTask copy : copies) {
                BigDecimal amount = null;
                if (money) {
                    // Ticked: what it added itself. Unticked: what it would,
                    // which is nothing while a payment step is waiting.
                    amount = copy.isDone() ? copy.getPaidAmount() : stepLeft ? null : routine.getAmount();
                    if (amount == null) {
                        continue;
                    }
                }
                if (copy.isDone() && ++ticked > RECENT_RUNS) {
                    continue;
                }
                linked.runs().add(new RunResponse(String.valueOf(copy.getId()), String.valueOf(routine.getId()),
                        copy.getLabel(), copy.getLoggedOn(), copy.isDone(), amount));
            }
        }
        // Newest first, whichever routine a run came from.
        for (Linked linked : byGoal.values()) {
            linked.runs().sort(Comparator.comparing(RunResponse::day).reversed());
        }
        return byGoal;
    }

    /** A deleted goal's routines carry on unlinked. The schema does the same with ON DELETE SET NULL. */
    @Transactional
    public void goalRemoved(Long pursuitId) {
        routines.unlinkFromPursuit(pursuitId);
    }
}
