package com.kaizen.profile;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One user's settings for one reminder. The title, body, icon, colour, group
 * and whether it is scheduled at all are app metadata that ships with the
 * frontend (`DEFAULT_REMINDERS`); {@code key} is what the two join on.
 *
 * <p>A row exists for every default from the moment the account is created, so
 * a PATCH only ever updates.
 */
@Entity
@Table(name = "reminders")
public class Reminder {

    /** Monthly reminders stop here so every month has the day. */
    public static final int MONTH_DAY_MAX = 28;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reminder_key", nullable = false, length = 40)
    private String key;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false, length = 10)
    private Cadence cadence;

    /** 0-6, Sunday first. Only read when the cadence is weekly. */
    @Column(nullable = false)
    private int weekday;

    /** 1-28. Only read when the cadence is monthly. */
    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    @Column(name = "time_of_day", nullable = false)
    private LocalTime time;

    protected Reminder() {
        // JPA
    }

    public Reminder(Long userId, String key, boolean enabled, Cadence cadence, int weekday, int dayOfMonth,
            LocalTime time) {
        this.userId = userId;
        this.key = key;
        this.enabled = enabled;
        this.cadence = cadence;
        this.weekday = weekday;
        this.dayOfMonth = dayOfMonth;
        this.time = time;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getKey() {
        return key;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Cadence getCadence() {
        return cadence;
    }

    public void setCadence(Cadence cadence) {
        this.cadence = cadence;
    }

    public int getWeekday() {
        return weekday;
    }

    public void setWeekday(int weekday) {
        this.weekday = weekday;
    }

    public int getDayOfMonth() {
        return dayOfMonth;
    }

    public void setDayOfMonth(int dayOfMonth) {
        this.dayOfMonth = dayOfMonth;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }
}
