package com.scooter.modules.confirmation.controller;

import com.scooter.modules.common.Result;
import com.scooter.modules.confirmation.entity.BookingConfirmation;
import com.scooter.modules.confirmation.service.ConfirmationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for retrieving booking confirmations.
 */
@RestController
@RequestMapping("/api/v1/confirmations")
public class ConfirmationController {

    @Autowired
    private ConfirmationService confirmationService;

    /**
     * Get confirmation details by booking ID.
     * Usage: GET /api/v1/confirmations/{bookingId}
     * * @param bookingId The ID of the booking to query.
     * 
     * @return The confirmation record if found.
     */
    @GetMapping("/{bookingId}")
    public Result<BookingConfirmation> getByBookingId(@PathVariable Long bookingId) {
        // The service will throw an exception if not found, handled by
        // GlobalExceptionHandler
        BookingConfirmation confirmation = confirmationService.findByBookingId(bookingId);
        return Result.success(confirmation);
    }
}