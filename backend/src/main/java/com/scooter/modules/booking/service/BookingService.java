package com.scooter.modules.booking.service;

import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.dto.PaymentRequest; // New Import
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.confirmation.entity.BookingConfirmation; // New Import
import com.scooter.modules.confirmation.repository.ConfirmationRepository; // New Import
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.ScooterRepository;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ScooterRepository scooterRepository;
    @Autowired
    private RentalOptionRepository rentalOptionRepository;
    @Autowired
    private ConfirmationRepository confirmationRepository; // New Injection

    /**
     * Issue #6: Create a new booking
     */
    @Transactional
    public Booking createBooking(Long userId, BookingRequest request) {
        Scooter scooter = scooterRepository.findById(request.getScooterId())
                .orElseThrow(() -> new RuntimeException("Scooter not found"));

        if (scooter.getStatus() != ScooterStatus.AVAILABLE) {
            throw new RuntimeException("Scooter is not available");
        }

        scooter.setStatus(ScooterStatus.LOCKED);
        scooterRepository.save(scooter);

        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setScooterId(scooter.getId());
        booking.setRentalOptionId(request.getRentalOptionId());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setCreatedAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    /**
     * Issue #7: Process mock payment and generate confirmation
     */
    @Transactional
    public BookingConfirmation processPayment(PaymentRequest request) {
        // 1. Fetch booking and validate
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new RuntimeException("Booking is not in a payable state");
        }

        // 2. Mock payment logic
        if (Boolean.FALSE.equals(request.getSimulateSuccess())) {
            // If payment fails, we could unlock the scooter or keep it pending.
            // For Sprint 1, we'll throw an exception to trigger rollback.
            throw new RuntimeException("Payment failed: Transaction rejected by mock provider");
        }

        // 3. Update Booking Status
        booking.setStatus(BookingStatus.PAID);
        bookingRepository.save(booking);

        // 4. Update Scooter Status to IN_USE
        Scooter scooter = scooterRepository.findById(booking.getScooterId())
                .orElseThrow(() -> new RuntimeException("Scooter lost during payment"));
        scooter.setStatus(ScooterStatus.IN_USE);
        scooterRepository.save(scooter);

        // 5. Create Confirmation Record
        BookingConfirmation confirmation = new BookingConfirmation();
        confirmation.setBookingId(booking.getId());
        confirmation.setConfirmationNumber("CONF-" + System.currentTimeMillis());
        confirmation.setConfirmedAt(LocalDateTime.now());

        return confirmationRepository.save(confirmation);
    }
}