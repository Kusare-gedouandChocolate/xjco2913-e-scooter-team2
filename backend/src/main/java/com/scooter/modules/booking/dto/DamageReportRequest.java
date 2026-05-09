package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class DamageReportRequest {
    @NotBlank(message = "Damage description is required")
    private String description;
    @Min(value = 0, message = "Estimated fee must not be negative")
    private Integer estimatedFeeInCents;
}
