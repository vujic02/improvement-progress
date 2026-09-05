package com.kaizen.pursuit;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * Anything worked towards over time: a saving, an investment, a lift, a
 * language, a dream. All three pages are built on this one shape and differ
 * only by {@link PursuitArea}.
 */
@Entity
@Table(name = "pursuits")
public class Pursuit {

    public static final int NAME_MAX = 40;

    /** Anything larger is a paste accident, not a savings goal. */
    public static final BigDecimal MAX_AMOUNT = BigDecimal.valueOf(1_000_000_000L);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PursuitArea area;

    @Column(nullable = false, length = NAME_MAX)
    private String name;

    /** One of its area's kinds. Null for areas that have none. */
    @Column(length = 32)
    private String kind;

    /** Set instead of a kind, for areas that have none. */
    @Column(length = 40)
    private String icon;

    /**
     * An https address, checked on write. It is only ever rendered as an
     * {@code <img src>} on the client — never an href, a style or a CSS url().
     */
    @Column(length = 2048)
    private String image;

    @Column(name = "target_amount", precision = 15, scale = 2)
    private BigDecimal target;

    @Column(name = "saved_amount", precision = 15, scale = 2)
    private BigDecimal saved;

    /**
     * When it started. Defaults to today on the client but stays editable —
     * people file things they started months ago. Serialised as `createdAt`.
     */
    @Column(name = "started_on", nullable = false)
    private LocalDate startedOn;

    /** When they want it finished. Serialised as `targetAt`. */
    @Column(name = "target_on", nullable = false)
    private LocalDate targetOn;

    /** Row creation, not the user-facing start date. Orders the grid. */
    // Written by Hibernate rather than left to the column default, so the
    // value does not depend on which database is underneath.
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "pursuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<PursuitStep> steps = new ArrayList<>();

    protected Pursuit() {
        // JPA
    }

    public Pursuit(Long userId, PursuitArea area, String name, LocalDate startedOn, LocalDate targetOn) {
        this.userId = userId;
        this.area = area;
        this.name = name;
        this.startedOn = startedOn;
        this.targetOn = targetOn;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public PursuitArea getArea() {
        return area;
    }

    public String getName() {
        return name;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public BigDecimal getTarget() {
        return target;
    }

    public void setTarget(BigDecimal target) {
        this.target = target;
    }

    public BigDecimal getSaved() {
        return saved;
    }

    public void setSaved(BigDecimal saved) {
        this.saved = saved;
    }

    public LocalDate getStartedOn() {
        return startedOn;
    }

    public LocalDate getTargetOn() {
        return targetOn;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<PursuitStep> getSteps() {
        return steps;
    }
}
