package com.scooter.modules.scooter.dto;

import com.scooter.modules.scooter.entity.ScooterStatus;
import lombok.Data;

@Data
public class ScooterResponse {
    private String scooterId;
    private String code;
    private String status;
    private String location;
    private Integer basePrice;
}
