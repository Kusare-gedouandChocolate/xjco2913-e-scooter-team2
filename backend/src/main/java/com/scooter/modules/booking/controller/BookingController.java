package com.scooter.modules.booking.controller;

import com.scooter.modules.common.Result;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing scooter bookings.
 */
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    /**
     * Endpoint to create a new booking.
     * 
     * @param request Contains scooterId and rentalOptionId.
     * @return The created booking record with PENDING_PAYMENT status.
     */
    @PostMapping
    public Result<Booking> create(@RequestBody BookingRequest request) {
        // Note: In a real scenario, userId would be extracted from the Security
        // Context/Token.
        // For now, we use a placeholder userId (e.g., 1L) for Sprint 1 testing.
        Long currentUserId = 1L;

        Booking newBooking = bookingService.createBooking(currentUserId, request);
        return Result.success(newBooking);
    }

    @PostMapping("/pay")
    public Result<BookingConfirmation> pay(@RequestBody PaymentRequest request) {
        return Result.success(bookingService.processPayment(request));
    }
}
