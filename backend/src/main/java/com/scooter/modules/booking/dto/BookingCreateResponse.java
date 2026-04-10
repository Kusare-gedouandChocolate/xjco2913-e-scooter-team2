package com.scooter.modules.booking.dto;

import lombok.Data;

@Data
public class BookingCreateResponse {
    private String bookingId;
    private String status;
    private String totalCost;
    private String originalCost;
    private String discountAmount;
    private String appliedDiscountType;
    private String appliedDiscountRate;
}
