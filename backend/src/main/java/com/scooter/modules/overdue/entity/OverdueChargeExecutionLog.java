package com.scooter.modules.overdue.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "overdue_charge_execution_log")
@Data
public class OverdueChargeExecutionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "trigger_type", nullable = false)
    private String triggerType;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(name = "charge_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal chargeAmount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private String status;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
