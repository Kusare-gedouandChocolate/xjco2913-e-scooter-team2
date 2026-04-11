package com.scooter.modules.scooter.dto;

import lombok.Data;

@Data
public class ScooterLocationResponse {
    private String scooterId;
    private String code;        // 对应 Scooter.model
    private String status;      // 小写状态名，如 "available"
    private Double latitude;
    private Double longitude;
}