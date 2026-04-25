package com.scooter.modules.walkin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalkInPickupResponse {
    private String customerId;
    private String bookingId;
    private String bookingStatus;
    private String totalCost;
    private String confirmationNumber;
    private String paymentMethod;
}
