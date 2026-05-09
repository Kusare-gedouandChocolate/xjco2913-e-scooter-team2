package com.scooter.modules.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class BookingResponse {
    private String bookingId;
    private String scooterId;
    private String scooterName;
    private String hireType;
    private String startTime;
    private String endTime;
    private String status;
    private String totalCost;
    private String originalCost;
    private String discountAmount;
    private String baseRentalFee;
    private String overtimeFee;
    private String batteryUsageFee;
    private String damageFee;
    private String appliedDiscountType;
    private String appliedDiscountRate;
    private String pickupCode;
    private String pickupCodeExpiresAt;
    private Integer pickupBatteryLevel;
    private Integer returnBatteryLevel;
    private Integer batteryLevelDelta;
    private Long overtimeMinutes;
    private Integer batteryUsagePercent;
    private Boolean damageReported;
}
