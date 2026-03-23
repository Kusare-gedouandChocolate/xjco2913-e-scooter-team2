package com.scooter.modules.booking.controller;

import com.scooter.common.response.Result;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.booking.dto.BookingCreateResponse;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.dto.BookingResponse;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Result<BookingCreateResponse> create(@RequestBody BookingRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        return Result.success(bookingService.createBooking(userId, request));
    }

    @GetMapping("/{bookingId}")
    public Result<Booking> getDetails(@PathVariable Long bookingId) {
        return Result.success(bookingService.getBookingById(bookingId));
    }

    @GetMapping
    public Result<List<BookingResponse>> getUserBookings(@RequestParam(defaultValue = "startTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        String userId = SecurityUtils.getCurrentUserId();
        List<BookingResponse> bookings = bookingService.findByUserId(userId, sortBy, sortOrder);
        return Result.success(bookings);
    }

    @PostMapping("/{bookingId}/cancel")
    public Result<Void> cancelBooking(@PathVariable Long bookingId) {
        bookingService.cancelBooking(bookingId);
        return Result.success(null);
    }
}