package com.scooter.modules.confirmation.service;

import com.scooter.modules.confirmation.entity.BookingConfirmation;
import com.scooter.modules.confirmation.repository.ConfirmationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ConfirmationService {
    @Autowired
    private ConfirmationRepository confirmationRepository;

    public BookingConfirmation findByBookingId(Long bookingId) {
        return confirmationRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Confirmation not found for booking: " + bookingId));
    }
}