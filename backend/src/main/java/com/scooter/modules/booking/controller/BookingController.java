package com.scooter.modules.booking.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Result<Booking> create(@RequestBody BookingRequest request) {
        return Result.success(bookingService.createBooking(1L, request));
    }

    @GetMapping("/{bookingId}")
    public Result<Booking> getDetails(@PathVariable Long bookingId) {
        return Result.success(bookingService.getBookingById(bookingId));
    }
}