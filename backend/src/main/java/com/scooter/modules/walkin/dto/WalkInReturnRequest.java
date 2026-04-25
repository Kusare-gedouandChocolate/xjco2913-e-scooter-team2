package com.scooter.modules.walkin.dto;

import com.scooter.modules.damage.entity.DamageLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalkInReturnRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    private Boolean damaged;

    private String damageDescription;

    private String damageImageUrl;

    private DamageLevel damageLevel;
}
