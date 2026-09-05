package com.kaizen.profile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUserIdOrderByIdAsc(Long userId);

    Optional<Reminder> findByUserIdAndKey(Long userId, String key);
}
