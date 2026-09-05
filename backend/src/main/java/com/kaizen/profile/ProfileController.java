package com.kaizen.profile;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import com.kaizen.profile.dto.ProfileResponse;
import com.kaizen.profile.dto.ReminderResponse;
import com.kaizen.profile.dto.UpdateProfileRequest;
import com.kaizen.profile.dto.UpdateReminderRequest;

import jakarta.validation.Valid;

/**
 * The notifications half of `#/profile`. The account half — name, email,
 * password — is on {@code /api/account}.
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ProfileResponse read(@AuthenticationPrincipal Long userId) {
        return service.read(userId);
    }

    @PatchMapping
    public ProfileResponse update(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return service.update(userId, request);
    }

    /** {@code key} is the reminder id the frontend's DEFAULT_REMINDERS uses. */
    @PatchMapping("/reminders/{key}")
    public ReminderResponse updateReminder(@AuthenticationPrincipal Long userId, @PathVariable String key,
            @Valid @RequestBody UpdateReminderRequest request) {
        return service.updateReminder(userId, key, request);
    }
}
