package com.scooter.modules.confirmation.repository;

import com.scooter.modules.confirmation.entity.BookingConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfirmationRepository extends JpaRepository<BookingConfirmation, Long> {
    /**
     * Find confirmation record by associated booking ID.
     */
    Optional<BookingConfirmation> findByBookingId(Long bookingId);
}