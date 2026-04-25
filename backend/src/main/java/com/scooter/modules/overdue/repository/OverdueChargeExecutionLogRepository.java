package com.scooter.modules.overdue.repository;

import com.scooter.modules.overdue.entity.OverdueChargeExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OverdueChargeExecutionLogRepository extends JpaRepository<OverdueChargeExecutionLog, Long> {
    long countByBookingId(Long bookingId);

    Optional<OverdueChargeExecutionLog> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
