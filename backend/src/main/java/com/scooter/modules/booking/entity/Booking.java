package com.scooter.modules.booking.entity;

import com.scooter.modules.scooter.entity.Scooter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.scooter.modules.scooter.entity.RentalOption;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@ToString(exclude = { "scooter", "rentalOption" })
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scooter_id", nullable = false)
    private Scooter scooter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_option_id", nullable = false)
    private RentalOption rentalOption;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "base_rental_fee", precision = 10, scale = 2)
    private BigDecimal baseRentalFee;

    @Column(name = "overtime_fee", precision = 10, scale = 2)
    private BigDecimal overtimeFee;

    @Column(name = "battery_usage_fee", precision = 10, scale = 2)
    private BigDecimal batteryUsageFee;

    @Column(name = "damage_fee", precision = 10, scale = 2)
    private BigDecimal damageFee;

    @Column(name = "overtime_minutes")
    private Long overtimeMinutes;

    @Column(name = "battery_usage_percent")
    private Integer batteryUsagePercent;

    @Column(name = "damage_reported")
    private Boolean damageReported;

    @Column(name = "auto_charged_amount", precision = 10, scale = 2)
    private BigDecimal autoChargedAmount;

    @Column(name = "last_overdue_reminder_at")
    private LocalDateTime lastOverdueReminderAt;

    private String appliedDiscountType;

    @Column(name = "applied_discount_rate", precision = 5, scale = 2)
    private BigDecimal appliedDiscountRate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "pickup_code")
    private String pickupCode;

    @Column(name = "pickup_code_expires_at")
    private LocalDateTime pickupCodeExpiresAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "pickup_battery_level")
    private Integer pickupBatteryLevel;

    @Column(name = "return_battery_level")
    private Integer returnBatteryLevel;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = BookingStatus.PENDING_PAYMENT;
        }
    }
}
