package com.scooter.modules.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull(message = "Scooter ID is required")
    private Long scooterId;
    @NotNull(message = "Rental option ID is required")
    private Long rentalOptionId;
    private LocalDateTime startTime;
}
