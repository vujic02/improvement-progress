package com.kaizen.pursuit;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A rung on the way to a pursuit: 70kg, 75kg, 80kg, or learn CI, learn CD,
 * wire up Actions. Progress is steps done over steps total.
 *
 * <p>In a money area a step is a payment instead - an amount and no label -
 * and ticking it moves that amount into the goal's balance.
 */
@Entity
@Table(name = "pursuit_steps")
public class PursuitStep {

    /** Steps get more room than names — they read as short sentences. */
    public static final int LABEL_MAX = 60;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pursuit_id", nullable = false)
    private Pursuit pursuit;

    /** Growth and dream steps. Null on a money step. */
    @Column(length = LABEL_MAX)
    private String label;

    /** Money steps. Null on a worded one. */
    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private boolean done;

    /** Keeps the list in the order it was written, not the order MySQL likes. */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected PursuitStep() {
        // JPA
    }

    public PursuitStep(Pursuit pursuit, String label, int sortOrder) {
        this.pursuit = pursuit;
        this.label = label;
        this.sortOrder = sortOrder;
        this.done = false;
    }

    public static PursuitStep payment(Pursuit pursuit, BigDecimal amount, int sortOrder) {
        PursuitStep step = new PursuitStep(pursuit, null, sortOrder);
        step.amount = amount;
        return step;
    }

    public Long getId() {
        return id;
    }

    public Pursuit getPursuit() {
        return pursuit;
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
