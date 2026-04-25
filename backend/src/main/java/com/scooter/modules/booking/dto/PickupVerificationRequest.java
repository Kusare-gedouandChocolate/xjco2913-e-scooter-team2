package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PickupVerificationRequest {
    @NotBlank(message = "Pickup code is required")
    private String pickupCode;
}
