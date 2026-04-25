package com.scooter.modules.confirmation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class BookingConfirmation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;
    private String confirmationNumber; // Unique code for the user
    private LocalDateTime confirmedAt;
    private String pickupCode;
    private LocalDateTime pickupCodeExpiresAt;
}
