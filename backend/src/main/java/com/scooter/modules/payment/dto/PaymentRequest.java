package com.scooter.modules.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * Request DTO for mock payment.
 */
@Data
public class PaymentRequest {
    @NotNull(message = "Booking ID is required")
    @Positive(message = "Booking ID must be a positive number")
    private Long bookingId;
    private String paymentMethod; // e.g., "CREDIT_CARD", "WALLET"
    private String cardToken;
    private Boolean simulateSuccess; // Used to simulate success or failure scenarios
}
