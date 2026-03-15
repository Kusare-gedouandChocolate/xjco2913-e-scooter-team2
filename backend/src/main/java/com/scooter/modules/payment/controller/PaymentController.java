package com.scooter.modules.payment.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.payment.dto.PaymentRequest;
import com.scooter.modules.confirmation.entity.BookingConfirmation;
import com.scooter.modules.booking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Result<BookingConfirmation> createPayment(@RequestBody PaymentRequest request) {
        return Result.success(bookingService.processPayment(request));
    }
}