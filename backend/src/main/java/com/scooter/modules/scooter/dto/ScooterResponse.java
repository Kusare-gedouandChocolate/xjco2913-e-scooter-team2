package com.scooter.modules.scooter.dto;

import com.scooter.modules.scooter.entity.ScooterStatus;
import lombok.Data;

@Data
public class ScooterResponse {
    private String id;
    private String model;
    private ScooterStatus status;
    private Integer batteryLevel;
    private Integer pricePerMinuteInCents;
}