package com.scooter.modules.walkin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class WalkInPickupRequest {

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotNull(message = "Scooter ID is required")
    private Long scooterId;

    @NotNull(message = "Rental option ID is required")
    private Long rentalOptionId;

    private LocalDateTime startTime;

    private String paymentMethod;

    private Boolean simulateSuccess;
}
