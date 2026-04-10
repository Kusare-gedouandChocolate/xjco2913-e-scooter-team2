package com.scooter.modules.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for mock payment.
 */
@Data
public class PaymentRequest {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    private String paymentMethod; // e.g., "CREDIT_CARD", "WALLET"
    private Boolean simulateSuccess; // Used to simulate success or failure scenarios
}