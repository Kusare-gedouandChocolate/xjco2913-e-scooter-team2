package com.scooter.modules.overdue.repository;

import com.scooter.modules.overdue.entity.ReminderRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ReminderRecordRepository extends JpaRepository<ReminderRecord, Long> {
    boolean existsByBookingIdAndReminderTypeAndCreatedAtAfter(Long bookingId, String reminderType, LocalDateTime createdAt);
}
