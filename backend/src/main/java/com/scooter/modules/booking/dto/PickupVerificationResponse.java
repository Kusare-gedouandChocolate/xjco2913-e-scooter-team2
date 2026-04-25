package com.scooter.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PickupVerificationResponse {
    private String bookingId;
    private String status;
    private String scooterStatus;
    private String pickedUpAt;
    private Integer pickupBatteryLevel;
}
