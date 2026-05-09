package com.scooter.modules.scooter.dto;

import com.scooter.modules.scooter.entity.ScooterStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminScooterRequest {
    @NotBlank(message = "Scooter model is required")
    @Size(max = 255, message = "Scooter model must be 255 characters or fewer")
    private String model;

    @NotNull(message = "Scooter status is required")
    private ScooterStatus status;

    @NotNull(message = "Battery level is required")
    @Min(value = 0, message = "Battery level must be between 0 and 100")
    @Max(value = 100, message = "Battery level must be between 0 and 100")
    private Integer batteryLevel;

    @NotBlank(message = "Scooter location is required")
    @Size(max = 255, message = "Scooter location must be 255 characters or fewer")
    private String currentLocation;
}
