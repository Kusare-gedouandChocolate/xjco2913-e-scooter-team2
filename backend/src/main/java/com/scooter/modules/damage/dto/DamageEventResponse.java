package com.scooter.modules.damage.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DamageEventResponse {
    private String damageEventId;
    private String bookingId;
    private String scooterId;
    private String reportedByUserId;
    private String damageLevel;
    private String description;
    private String imageUrl;
    private String damageFee;
    private String createdAt;
}
