package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DamageReportRequest {
    @NotBlank(message = "Damage description is required")
    private String description;
    private Integer estimatedFeeInCents;
}