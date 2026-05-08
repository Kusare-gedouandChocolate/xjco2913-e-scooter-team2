package com.scooter.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SettlementResponse {
    private String bookingId;
    private Integer batteryLevelAtCheckout;
    private Integer batteryLevelAtReturn;
    private Long overtimeMinutes;
    private String damageStatus;
    private FeeBreakdown fees;

    @Data
    @Builder
    public static class FeeBreakdown {
        private String baseFeeInCents;
        private String overtimeFeeInCents;
        private String batteryDeltaFeeInCents;
        private String damageFeeInCents;
        private String totalInCents;
    }
}