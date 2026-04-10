package com.scooter.modules.scooter.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminScooterResponse {
    private String scooterId;
    private String model;
    private String status;
    private Integer batteryLevel;
    private String currentLocation;
    private LocalDateTime createdAt;
}
