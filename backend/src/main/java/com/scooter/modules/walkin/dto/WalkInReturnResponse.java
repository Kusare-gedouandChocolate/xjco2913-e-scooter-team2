package com.scooter.modules.walkin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalkInReturnResponse {
    private String bookingId;
    private String bookingStatus;
    private String scooterStatus;
    private String totalCost;
    private String baseRentalFee;
    private String overtimeFee;
    private String batteryUsageFee;
    private String damageFee;
    private Integer pickupBatteryLevel;
    private Integer returnBatteryLevel;
    private Integer batteryLevelDelta;
    private Long overtimeMinutes;
    private Integer batteryUsagePercent;
    private Boolean damageReported;
}
