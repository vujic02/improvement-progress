package com.kaizen.routine;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A recurring task: a label, a type and a schedule. It is only a template -
 * each day it runs on gets its own ordinary {@code DayTask}, filled in by
 * {@link RoutineService#materialize}.
 */
@Entity
@Table(name = "routines")
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "custom_type_id")
    private Long customTypeId;

    @Column(name = "default_key", length = 20)
    private String defaultKey;

    /** The goal it counts toward, if any. Deleting the goal leaves this null. */
    @Column(name = "pursuit_id")
    private Long pursuitId;

    @Column(nullable = false, length = 80)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RoutineCadence cadence;

    /** Bit 0 is Sunday, bit 6 Saturday - JavaScript's getDay numbering. */
    @Column(nullable = false)
    private int weekdays;

    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    @Column(name = "interval_n")
    private Integer interval;

    /** Money goals only: what a tick adds when the goal has no unpaid payment step left. */
    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    /** Every-n schedules count from here, and nothing is filled in before it. */
    @Column(name = "starts_on", nullable = false)
    private LocalDate startsOn;

    /** The last day already filled in. Null until the first fill. */
    @Column(name = "generated_through")
    private LocalDate generatedThrough;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Routine() {
        // JPA
    }

    public Routine(Long userId, LocalDate startsOn) {
        this.userId = userId;
        this.startsOn = startsOn;
    }

    /** Whether this routine puts a task on {@code day}. */
    public boolean runsOn(LocalDate day) {
        if (day.isBefore(startsOn)) {
            return false;
        }
        return switch (cadence) {
            case DAILY -> true;
            case WEEKLY -> hasWeekday(day);
            case MONTH_FIRST -> day.getDayOfMonth() == 1;
            case MONTH_LAST -> day.getDayOfMonth() == day.lengthOfMonth();
            case MONTH_DAY -> day.getDayOfMonth() == Math.min(dayOfMonth, day.lengthOfMonth());
            case EVERY_N_DAYS -> ChronoUnit.DAYS.between(startsOn, day) % interval == 0;
            case EVERY_N_WEEKS -> hasWeekday(day)
                    && ChronoUnit.WEEKS.between(sundayOf(startsOn), sundayOf(day)) % interval == 0;
        };
    }

    private boolean hasWeekday(LocalDate day) {
        return (weekdays & (1 << sundayFirst(day.getDayOfWeek()))) != 0;
    }

    /** Sunday is 0, Saturday 6 - the week view and getDay count this way. */
    static int sundayFirst(DayOfWeek day) {
        return day.getValue() % 7;
    }

    private static LocalDate sundayOf(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
    }

    /** The client's id for the type: a custom type's id as a string, or a built-in's key. */
    public String getTypeId() {
        return customTypeId != null ? String.valueOf(customTypeId) : defaultKey;
    }

    public void setType(Long customTypeId, String defaultKey) {
        this.customTypeId = customTypeId;
        this.defaultKey = defaultKey;
    }

    public void setSchedule(RoutineCadence cadence, int weekdays, Integer dayOfMonth, Integer interval) {
        this.cadence = cadence;
        this.weekdays = weekdays;
        this.dayOfMonth = dayOfMonth;
        this.interval = interval;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getCustomTypeId() {
        return customTypeId;
    }

    public String getDefaultKey() {
        return defaultKey;
    }

    public Long getPursuitId() {
        return pursuitId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    /** Links it to a goal, with the amount a tick pays when there is no step to tick. */
    public void setGoal(Long pursuitId, BigDecimal amount) {
        this.pursuitId = pursuitId;
        this.amount = amount;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public RoutineCadence getCadence() {
        return cadence;
    }

    public int getWeekdays() {
        return weekdays;
    }

    public Integer getDayOfMonth() {
        return dayOfMonth;
    }

    public Integer getInterval() {
        return interval;
    }

    public LocalDate getStartsOn() {
        return startsOn;
    }

    public LocalDate getGeneratedThrough() {
        return generatedThrough;
    }

    public void setGeneratedThrough(LocalDate generatedThrough) {
        this.generatedThrough = generatedThrough;
    }
}
