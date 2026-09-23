package com.kaizen.daytask;

import java.time.Instant;
import java.time.LocalDate;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One task on one day. The type is held as either a custom type's id or a
 * built-in's key, never both - see {@code V3__day_tasks.sql} for why they are
 * separate columns and {@link #getTypeId()} for the single string the client
 * sees.
 */
@Entity
@Table(name = "day_tasks")
public class DayTask {

    /** Long enough for a real sentence, short enough to stay one line on a card. */
    public static final int LABEL_MAX = 80;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Set for a custom type; null for a built-in. */
    @Column(name = "custom_type_id")
    private Long customTypeId;

    /** Set for a built-in; null for a custom type. */
    @Column(name = "default_key", length = 20)
    private String defaultKey;

    @Column(nullable = false, length = LABEL_MAX)
    private String label;

    @Column(name = "logged_on", nullable = false)
    private LocalDate loggedOn;

    @Column(nullable = false)
    private boolean done;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DayTask() {
        // JPA
    }

    public DayTask(Long userId, String label, LocalDate loggedOn) {
        this.userId = userId;
        this.label = label;
        this.loggedOn = loggedOn;
    }

    /**
     * The id the client uses for a type: a custom type's id as a string, or a
     * built-in's key. It is what {@code TaskType.id} holds on the frontend.
     */
    public String getTypeId() {
        return customTypeId != null ? String.valueOf(customTypeId) : defaultKey;
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

    /** Sets the custom half of the type and clears the built-in half. */
    public void setCustomTypeId(Long customTypeId) {
        this.customTypeId = customTypeId;
        this.defaultKey = null;
    }

    public String getDefaultKey() {
        return defaultKey;
    }

    /** Sets the built-in half of the type and clears the custom half. */
    public void setDefaultKey(String defaultKey) {
        this.defaultKey = defaultKey;
        this.customTypeId = null;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public LocalDate getLoggedOn() {
        return loggedOn;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
