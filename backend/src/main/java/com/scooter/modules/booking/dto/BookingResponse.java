package com.scooter.modules.booking.dto;

import lombok.Data;

@Data
public class BookingResponse {
    private String bookingId;
    private String scooterId;
    private String scooterName;
    private String scooterStatus;
    private Integer scooterBatteryLevel;
    private String hireType;
    private Integer durationHours;
    private String startTime;
    private String endTime;
    private String pickedUpAt;
    private String completedAt;
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
