package com.scooter.modules.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class BookingResponse {
    private String bookingId;
    private String scooterId;
    private String hireType;
    private String startTime;
    private String endTime;
    private String status;
    private String totalCost;
    private String originalCost;
    private String discountAmount;
    private String appliedDiscountType;
    private String appliedDiscountRate;
}
