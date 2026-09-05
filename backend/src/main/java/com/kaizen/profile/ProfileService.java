package com.kaizen.profile;

import java.time.DateTimeException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.profile.dto.ProfileResponse;
import com.kaizen.profile.dto.ReminderResponse;
import com.kaizen.profile.dto.UpdateProfileRequest;
import com.kaizen.profile.dto.UpdateReminderRequest;

@Service
public class ProfileService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    private static final int LAST_WEEKDAY = 6;

    private final ProfileSettingsRepository settingsRepo;
    private final ReminderRepository reminderRepo;

    public ProfileService(ProfileSettingsRepository settingsRepo, ReminderRepository reminderRepo) {
        this.settingsRepo = settingsRepo;
        this.reminderRepo = reminderRepo;
    }

    /** Called once, as part of registration, inside that transaction. */
    public void seedFor(Long userId) {
        settingsRepo.save(new ProfileSettings(userId));
        reminderRepo.saveAll(ReminderDefaults.ALL.stream()
                .map(d -> new Reminder(userId, d.key(), d.enabled(), d.cadence(), d.weekday(), d.dayOfMonth(),
                        d.time()))
                .toList());
    }

    @Transactional(readOnly = true)
    public ProfileResponse read(Long userId) {
        return respond(settings(userId), reminderRepo.findByUserIdOrderByIdAsc(userId));
    }

    @Transactional
    public ProfileResponse update(Long userId, UpdateProfileRequest request) {
        ProfileSettings settings = settings(userId);
        if (request.keepSignedIn() != null) {
            settings.setKeepSignedIn(request.keepSignedIn());
        }
        if (request.paused() != null) {
            settings.setPaused(request.paused());
        }
        if (request.push() != null) {
            settings.setPush(request.push());
        }
        if (request.email() != null) {
            settings.setEmail(request.email());
        }
        return respond(settings, reminderRepo.findByUserIdOrderByIdAsc(userId));
    }

    @Transactional
    public ReminderResponse updateReminder(Long userId, String key, UpdateReminderRequest request) {
        Reminder reminder = reminderRepo.findByUserIdAndKey(userId, key)
                .orElseThrow(() -> ApiException.notFound("No reminder called '" + key + "'."));

        if (request.enabled() != null) {
            reminder.setEnabled(request.enabled());
        }
        if (request.cadence() != null) {
            reminder.setCadence(request.cadence());
        }
        if (request.weekday() != null) {
            int weekday = request.weekday();
            if (weekday < 0 || weekday > LAST_WEEKDAY) {
                throw ApiException.badRequest("Weekday runs 0 (Sunday) to 6.");
            }
            reminder.setWeekday(weekday);
        }
        if (request.dayOfMonth() != null) {
            int day = request.dayOfMonth();
            // Stops at the 28th so every month has the day. "Last day of the
            // month" would need its own value, not a number.
            if (day < 1 || day > Reminder.MONTH_DAY_MAX) {
                throw ApiException.badRequest("Pick a day from 1 to " + Reminder.MONTH_DAY_MAX + ".");
            }
            reminder.setDayOfMonth(day);
        }
        if (request.time() != null) {
            reminder.setTime(parseTime(request.time()));
        }

        return ReminderResponse.of(reminder);
    }

    private ProfileSettings settings(Long userId) {
        return settingsRepo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("No profile for that account."));
    }

    private static ProfileResponse respond(ProfileSettings settings, List<Reminder> reminders) {
        return new ProfileResponse(
                settings.isKeepSignedIn(),
                settings.isPaused(),
                new ProfileResponse.Channels(settings.isPush(), settings.isEmail()),
                reminders.stream().map(ReminderResponse::of).toList());
    }

    private static LocalTime parseTime(String raw) {
        try {
            return LocalTime.parse(raw.trim(), HH_MM);
        } catch (DateTimeException ex) {
            throw ApiException.badRequest("Times are 24-hour, like 09:00.");
        }
    }
}
