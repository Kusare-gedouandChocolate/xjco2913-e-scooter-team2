package com.scooter.modules.scooter.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO for Scooter information.
 * Excludes sensitive internal fields to meet security requirements.
 */
@Data
public class ScooterResponse {
    private Long id;
    private String modelName;
    private Double batteryLevel;
    private String location;
    private String status;
}