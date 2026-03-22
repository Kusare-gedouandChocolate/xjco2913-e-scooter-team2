package com.scooter.modules.booking.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookingResponse {
    private String bookingId;
    private String scooterId;
    private String hireType;
    private String startTime;
    private String endTime;
    private String status;
    private BigDecimal totalCost;
}
