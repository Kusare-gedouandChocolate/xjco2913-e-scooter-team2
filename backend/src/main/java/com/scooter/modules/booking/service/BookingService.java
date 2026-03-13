package com.scooter.modules.booking.service;

import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.entity.RentalOption;
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

    @Transactional
    public Booking createBooking(Long userId, BookingRequest request) {
        // 1. Check if scooter exists and is AVAILABLE
        Scooter scooter = scooterRepository.findById(request.getScooterId())
                .orElseThrow(() -> new RuntimeException("Scooter not found"));

        if (scooter.getStatus() != ScooterStatus.AVAILABLE) {
            throw new RuntimeException("Scooter is not available for booking");
        }

        // 2. Validate rental option
        RentalOption option = rentalOptionRepository.findById(request.getRentalOptionId())
                .orElseThrow(() -> new RuntimeException("Invalid pricing option"));

        // 3. Lock the scooter status to prevent double booking
        scooter.setStatus(ScooterStatus.LOCKED);
        scooterRepository.save(scooter);

        // 4. Create booking record
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setScooterId(scooter.getId());
        booking.setRentalOptionId(option.getId());
        booking.setTotalPrice(option.getPrice());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setCreatedAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }
}