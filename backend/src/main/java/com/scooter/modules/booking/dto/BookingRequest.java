package com.scooter.modules.booking.dto;

import lombok.Data;

@Data
public class BookingRequest {
    private Long scooterId;
    private Long rentalOptionId;
}