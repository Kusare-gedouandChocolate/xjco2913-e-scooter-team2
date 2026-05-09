package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull(message = "Scooter ID is required")
    @Positive(message = "Scooter ID must be a positive number")
    private Long scooterId;
    @NotNull(message = "Rental option ID is required")
    @Positive(message = "Rental option ID must be a positive number")
    private Long rentalOptionId;
    private LocalDateTime startTime;
}
