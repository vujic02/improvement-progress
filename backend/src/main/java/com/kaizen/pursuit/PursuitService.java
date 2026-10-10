package com.kaizen.pursuit;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.daytask.DayTaskRepository;
import com.kaizen.pursuit.dto.ContributeRequest;
import com.kaizen.pursuit.dto.NewPursuitRequest;
import com.kaizen.pursuit.dto.NewStepRequest;
import com.kaizen.pursuit.dto.PursuitResponse;
import com.kaizen.pursuit.dto.UpdatePursuitRequest;
import com.kaizen.pursuit.dto.UpdateStepRequest;
import com.kaizen.routine.GoalLinks;
import com.kaizen.routine.RoutineService;

/**
 * The rules the in-memory {@code PursuitsProvider} used to hold. They live here
 * now because a client-side check is a courtesy and this one is the guarantee.
 */
@Service
public class PursuitService {

    /** 500 x 60 is five years of monthly payments - past that is a typo. */
    static final int STEP_BATCH_MAX = 60;

    /** Per goal, worded or money. Keeps a card and its response a sane size. */
    static final int STEPS_MAX = 120;

    private final PursuitRepository repo;
    private final GoalLinks links;
    private final RoutineService routines;
    private final DayTaskRepository dayTasks;

    public PursuitService(PursuitRepository repo, GoalLinks links, RoutineService routines,
            DayTaskRepository dayTasks) {
        this.repo = repo;
        this.links = links;
        this.routines = routines;
        this.dayTasks = dayTasks;
    }

    /** One goal as the client sees it, habits included. Writes use the server's today. */
    private PursuitResponse respond(Pursuit pursuit) {
        GoalLinks.Linked linked = links
                .linksFor(pursuit.getUserId(), List.of(pursuit), RoutineService.clientToday(null))
                .getOrDefault(pursuit.getId(), GoalLinks.Linked.NONE);
        return PursuitResponse.of(pursuit, linked);
    }

    /**
     * Fills in the account's routines first, so a goal's habits count today's
     * copy even when the days have not been read yet.
     *
     * @param today the client's today; null falls back to the server's
     */
    @Transactional
    public List<PursuitResponse> list(Long userId, PursuitArea area, LocalDate today) {
        LocalDate day = RoutineService.clientToday(today);
        routines.materialize(userId, day);
        List<Pursuit> goals = repo.findByUserIdAndAreaOrderByCreatedAtDescIdDesc(userId, area);
        var linked = links.linksFor(userId, goals, day);
        return goals.stream()
                .map(goal -> PursuitResponse.of(goal, linked.getOrDefault(goal.getId(), GoalLinks.Linked.NONE)))
                .toList();
    }

    @Transactional
    public PursuitResponse add(Long userId, PursuitArea area, NewPursuitRequest request) {
        String name = nameFor(request.name());
        // Unique within its own area only - a "House" dream and a "House"
        // savings goal are the same thing seen from two pages.
        if (repo.existsByUserIdAndAreaAndName(userId, area, name)) {
            throw ApiException.conflict("You already have one with that name.");
        }
        checkDates(request.createdAt(), request.targetAt());

        Pursuit pursuit = new Pursuit(userId, area, name, request.createdAt(), request.targetAt());
        pursuit.setKind(kindFor(area, request.kind()));
        pursuit.setIcon(iconFor(area, request.icon()));
        pursuit.setImage(imageFor(request.image()));

        if (area.isMoney()) {
            pursuit.setTarget(amount(request.target(), "target"));
            pursuit.setSaved(amount(request.saved(), "starting balance"));
        } else if (request.target() != null || request.saved() != null) {
            // A bench press has no price.
            throw ApiException.badRequest("Goals on this page do not carry amounts.");
        }

        return respond(repo.save(pursuit));
    }

    /**
     * Rewrites everything the create modal set, except the area and the
     * balance. The body is the whole form, so a blank image or target clears
     * it. Steps are untouched - they have their own endpoints.
     */
    @Transactional
    public PursuitResponse update(Long userId, Long id, UpdatePursuitRequest request) {
        Pursuit pursuit = require(userId, id);
        PursuitArea area = pursuit.getArea();

        String name = nameFor(request.name());
        if (repo.existsByUserIdAndAreaAndNameIgnoreCaseAndIdNot(userId, area, name, id)) {
            throw ApiException.conflict("You already have one with that name.");
        }
        checkDates(request.createdAt(), request.targetAt());

        String kind = kindFor(area, request.kind());
        String icon = iconFor(area, request.icon());
        String image = imageFor(request.image());
        BigDecimal target;
        if (area.isMoney()) {
            target = amount(request.target(), "target");
        } else if (request.target() != null) {
            throw ApiException.badRequest("Goals on this page do not carry amounts.");
        } else {
            target = null;
        }

        // Every check has passed before anything is written, so a rejected
        // edit leaves the goal exactly as it was.
        pursuit.setName(name);
        pursuit.setKind(kind);
        pursuit.setIcon(icon);
        pursuit.setImage(image);
        pursuit.setTarget(target);
        pursuit.setStartedOn(request.createdAt());
        pursuit.setTargetOn(request.targetAt());
        return respond(pursuit);
    }

    @Transactional
    public void remove(Long userId, Long id) {
        Pursuit pursuit = require(userId, id);
        for (PursuitStep step : pursuit.getSteps()) {
            dayTasks.forgetPaidStep(step.getId());
        }
        links.goalRemoved(id);
        repo.delete(pursuit);
    }

    /**
     * Adds a worded step to a growth goal or a dream, or payments to a money
     * goal - {@code count} identical ones, so 500 x 12 lays out a year in one
     * request. Returns the whole goal, since a batch is more than one step.
     */
    @Transactional
    public PursuitResponse addStep(Long userId, Long pursuitId, NewStepRequest request) {
        Pursuit pursuit = require(userId, pursuitId);
        int next = pursuit.getSteps().size();

        if (pursuit.getArea().isMoney()) {
            if (request.label() != null && !request.label().isBlank()) {
                throw ApiException.badRequest("Steps here are amounts, not words.");
            }
            BigDecimal amount = request.amount();
            if (amount == null || amount.signum() <= 0) {
                throw ApiException.badRequest("Enter an amount above zero.");
            }
            if (amount.compareTo(Pursuit.MAX_AMOUNT) > 0) {
                throw ApiException.badRequest("That amount is too large.");
            }
            int count = request.count() == null ? 1 : request.count();
            if (count < 1 || count > STEP_BATCH_MAX) {
                throw ApiException.badRequest("Add between 1 and " + STEP_BATCH_MAX + " at a time.");
            }
            if (next + count > STEPS_MAX) {
                throw ApiException.badRequest("A goal holds up to " + STEPS_MAX + " steps.");
            }
            for (int i = 0; i < count; i++) {
                pursuit.getSteps().add(PursuitStep.payment(pursuit, amount, next + i));
            }
        } else {
            if (request.amount() != null) {
                throw ApiException.badRequest("Goals on this page do not carry amounts.");
            }
            if (request.count() != null && request.count() != 1) {
                throw ApiException.badRequest("Add one step at a time.");
            }
            String label = request.label() == null ? "" : request.label().trim();
            if (label.isEmpty()) {
                throw ApiException.badRequest("Describe the step first.");
            }
            if (label.length() > PursuitStep.LABEL_MAX) {
                throw ApiException.badRequest("Keep it to " + PursuitStep.LABEL_MAX + " characters.");
            }
            boolean taken = pursuit.getSteps().stream()
                    .anyMatch(step -> label.equalsIgnoreCase(step.getLabel()));
            if (taken) {
                throw ApiException.conflict("That step is already on the list.");
            }
            if (next + 1 > STEPS_MAX) {
                throw ApiException.badRequest("A goal holds up to " + STEPS_MAX + " steps.");
            }
            pursuit.getSteps().add(new PursuitStep(pursuit, label, next));
        }

        repo.flush();
        return respond(pursuit);
    }

    /**
     * No {@code done} in the body flips the step, which is what the card wants.
     * A payment moves its amount with it: ticking puts it into the balance,
     * unticking takes it back out, clamped at zero like any contribution.
     * Returns the whole goal, because the balance may have moved too.
     */
    @Transactional
    public PursuitResponse updateStep(Long userId, Long pursuitId, Long stepId, UpdateStepRequest request) {
        Pursuit pursuit = require(userId, pursuitId);
        PursuitStep step = step(pursuit, stepId);

        boolean done = request.done() == null ? !step.isDone() : request.done();
        if (done != step.isDone() && step.getAmount() != null) {
            BigDecimal saved = pursuit.getSaved() == null ? BigDecimal.ZERO : pursuit.getSaved();
            BigDecimal next = done ? saved.add(step.getAmount()) : saved.subtract(step.getAmount());
            pursuit.setSaved(next.max(BigDecimal.ZERO));
        }
        step.setDone(done);
        return respond(pursuit);
    }

    /**
     * Removing a ticked payment leaves its money in the balance: the step was
     * the plan, the money is already put aside. Taking it back out is a
     * negative contribution.
     */
    @Transactional
    public void removeStep(Long userId, Long pursuitId, Long stepId) {
        Pursuit pursuit = require(userId, pursuitId);
        dayTasks.forgetPaidStep(stepId);
        pursuit.getSteps().remove(step(pursuit, stepId));
    }

    /**
     * Moves money in or out. The balance clamps at zero, and overshooting a
     * target is allowed - putting aside more than you meant to is a real thing
     * that happens, not an error.
     */
    @Transactional
    public PursuitResponse contribute(Long userId, Long pursuitId, ContributeRequest request) {
        Pursuit pursuit = require(userId, pursuitId);
        if (!pursuit.getArea().isMoney()) {
            throw ApiException.badRequest("Goals on this page do not carry amounts.");
        }

        BigDecimal delta = request.amount();
        if (delta.signum() == 0) {
            throw ApiException.badRequest("Enter an amount.");
        }
        if (delta.abs().compareTo(Pursuit.MAX_AMOUNT) > 0) {
            throw ApiException.badRequest("That amount is too large.");
        }

        BigDecimal next = (pursuit.getSaved() == null ? BigDecimal.ZERO : pursuit.getSaved()).add(delta);
        pursuit.setSaved(next.max(BigDecimal.ZERO));
        return respond(pursuit);
    }

    private Pursuit require(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No such goal."));
    }

    private static PursuitStep step(Pursuit pursuit, Long stepId) {
        return pursuit.getSteps().stream()
                .filter(candidate -> candidate.getId().equals(stepId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("No such step."));
    }

    private static String nameFor(String raw) {
        String name = raw.trim();
        if (name.isEmpty()) {
            throw ApiException.badRequest("Give it a name.");
        }
        if (name.length() > Pursuit.NAME_MAX) {
            throw ApiException.badRequest("Keep the name to " + Pursuit.NAME_MAX + " characters.");
        }
        return name;
    }

    private static void checkDates(LocalDate start, LocalDate target) {
        if (target.isBefore(start)) {
            throw ApiException.badRequest("The target date is before the start date.");
        }
    }

    /** Kinds are a closed list per area, and areas without kinds take none. */
    private static String kindFor(PursuitArea area, String raw) {
        String kind = raw == null ? null : raw.trim().toLowerCase(Locale.ROOT);

        if (!area.hasKinds()) {
            if (kind != null && !kind.isEmpty()) {
                throw ApiException.badRequest("Goals on this page have no kinds.");
            }
            return null;
        }
        if (kind == null || kind.isEmpty()) {
            throw ApiException.badRequest("Say what kind it is.");
        }
        if (!area.kinds().contains(kind)) {
            throw ApiException.badRequest("That is not one of the kinds on this page.");
        }
        return kind;
    }

    /**
     * Areas with no kinds identify a pursuit by its icon, and it is required:
     * it is the fallback shown when there is no image and when one fails to
     * load, so a dead link degrades instead of leaving a hole in the grid.
     */
    private static String iconFor(PursuitArea area, String raw) {
        if (area.hasKinds()) {
            return null;
        }
        String icon = raw == null ? "" : raw.trim();
        if (icon.isEmpty()) {
            throw ApiException.badRequest("Pick an icon.");
        }
        return icon;
    }

    /**
     * https only, re-checked here rather than trusted from the client. The
     * value is rendered into an {@code <img src>} and nowhere else - the scheme
     * check is what makes that safe, and an href or a CSS url() would void it.
     */
    private static String imageFor(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isEmpty()) {
            return null;
        }
        try {
            URI url = new URI(value);
            if (!"https".equalsIgnoreCase(url.getScheme()) || url.getHost() == null) {
                throw ApiException.badRequest("Use an https:// address for the image.");
            }
            return url.toASCIIString();
        } catch (URISyntaxException ex) {
            throw ApiException.badRequest("Use an https:// address for the image.");
        }
    }

    private static BigDecimal amount(BigDecimal value, String what) {
        if (value == null) {
            return null;
        }
        if (value.signum() < 0) {
            throw ApiException.badRequest("Amounts have to be zero or more.");
        }
        if (value.compareTo(Pursuit.MAX_AMOUNT) > 0) {
            throw ApiException.badRequest("That " + what + " is too large.");
        }
        return value;
    }
}
