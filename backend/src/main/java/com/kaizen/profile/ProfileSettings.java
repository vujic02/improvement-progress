package com.kaizen.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One row per user. Created with the account, never deleted separately. */
@Entity
@Table(name = "profile_settings")
public class ProfileSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "keep_signed_in", nullable = false)
    private boolean keepSignedIn = true;

    /**
     * The master switch. Stops delivery without turning the individual
     * reminders off, so unpausing restores exactly what was set before.
     */
    @Column(nullable = false)
    private boolean paused = false;

    @Column(name = "push_enabled", nullable = false)
    private boolean push = true;

    @Column(name = "email_enabled", nullable = false)
    private boolean email = true;

    protected ProfileSettings() {
        // JPA
    }

    public ProfileSettings(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }

    public boolean isKeepSignedIn() {
        return keepSignedIn;
    }

    public void setKeepSignedIn(boolean keepSignedIn) {
        this.keepSignedIn = keepSignedIn;
    }

    public boolean isPaused() {
        return paused;
    }

    public void setPaused(boolean paused) {
        this.paused = paused;
    }

    public boolean isPush() {
        return push;
    }

    public void setPush(boolean push) {
        this.push = push;
    }

    public boolean isEmail() {
        return email;
    }

    public void setEmail(boolean email) {
        this.email = email;
    }
}
