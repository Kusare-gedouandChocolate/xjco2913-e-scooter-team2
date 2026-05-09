package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PickupVerificationRequest {
    @NotBlank(message = "Pickup code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Pickup code must be a 6-digit number")
    private String pickupCode;
}
