package com.kaizen.tasktype;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A type the user added. The 12 defaults are not rows — see
 * {@link TaskTypeDefaults}.
 */
@Entity
@Table(name = "custom_task_types")
public class CustomTaskType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = TaskTypeDefaults.NAME_MAX)
    private String label;

    /** A glyph name from the client's hand-drawn icon set, not a library. */
    @Column(nullable = false, length = 40)
    private String icon;

    @Column(nullable = false, length = 32)
    private String color;

    // Written by Hibernate rather than left to the column default, so the
    // value does not depend on which database is underneath.
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CustomTaskType() {
        // JPA
    }

    public CustomTaskType(Long userId, String label, String icon, String color) {
        this.userId = userId;
        this.label = label;
        this.icon = icon;
        this.color = color;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getLabel() {
        return label;
    }

    public String getIcon() {
        return icon;
    }

    public String getColor() {
        return color;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
