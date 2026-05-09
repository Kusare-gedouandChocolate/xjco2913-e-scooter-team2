package com.scooter.modules.walkin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class WalkInPickupRequest {

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotNull(message = "Scooter ID is required")
    @Positive(message = "Scooter ID must be a positive number")
    private Long scooterId;

    @NotNull(message = "Rental option ID is required")
    @Positive(message = "Rental option ID must be a positive number")
    private Long rentalOptionId;

    private LocalDateTime startTime;

    private String paymentMethod;

    private Boolean simulateSuccess;
}
