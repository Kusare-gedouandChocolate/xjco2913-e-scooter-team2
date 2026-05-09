package com.scooter.modules.walkin.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.RoleUtils;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.booking.dto.BookingCreateResponse;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.service.BookingService;
import com.scooter.modules.confirmation.entity.BookingConfirmation;
import com.scooter.modules.payment.dto.PaymentRequest;
import com.scooter.modules.payment.service.CardTokenService;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.walkin.dto.WalkInCustomerCreateRequest;
import com.scooter.modules.walkin.dto.WalkInCustomerResponse;
import com.scooter.modules.walkin.dto.WalkInPickupRequest;
import com.scooter.modules.walkin.dto.WalkInPickupResponse;
import com.scooter.modules.walkin.dto.WalkInReturnRequest;
import com.scooter.modules.walkin.dto.WalkInReturnResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WalkInService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CardTokenService cardTokenService;

    @Autowired
    private BookingService bookingService;

    @Transactional
    public WalkInCustomerResponse createWalkInCustomer(WalkInCustomerCreateRequest request) {
        cardTokenService.validateCardTokenOrThrow(request.getCardToken());

        User user = User.builder()
                .email(generateWalkInEmail())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role("customer")
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .cardToken(request.getCardToken().trim())
                .walkInCustomer(Boolean.TRUE)
                .build();

        User savedUser = userRepository.save(user);
        return WalkInCustomerResponse.builder()
                .userId(savedUser.getUserId())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .role(RoleUtils.normalizeRole(savedUser.getRole()))
                .walkInCustomer(savedUser.getWalkInCustomer())
                .build();
    }

    @Transactional
    public WalkInPickupResponse pickupScooter(WalkInPickupRequest request) {
        User customer = getWalkInCustomer(request.getCustomerId());

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setScooterId(request.getScooterId());
        bookingRequest.setRentalOptionId(request.getRentalOptionId());
        bookingRequest.setStartTime(request.getStartTime());

        BookingCreateResponse bookingResponse = bookingService.createBookingForUser(customer.getUserId(), bookingRequest);

        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setBookingId(Long.valueOf(bookingResponse.getBookingId()));
        paymentRequest.setPaymentMethod(request.getPaymentMethod());
        paymentRequest.setCardToken(customer.getCardToken());
        paymentRequest.setSimulateSuccess(request.getSimulateSuccess());

        BookingConfirmation confirmation = bookingService.processPayment(paymentRequest);
        bookingService.activateWalkInPickup(Long.valueOf(bookingResponse.getBookingId()));

        return WalkInPickupResponse.builder()
                .customerId(customer.getUserId().toString())
                .bookingId(bookingResponse.getBookingId())
                .bookingStatus("IN_PROGRESS")
                .totalCost(bookingResponse.getTotalCost())
                .confirmationNumber(confirmation.getConfirmationNumber())
                .paymentMethod(paymentRequest.getPaymentMethod() != null
                        ? paymentRequest.getPaymentMethod()
                        : "CREDIT_CARD")
                .build();
    }

    @Transactional
    public WalkInReturnResponse returnScooter(WalkInReturnRequest request) {
        Booking booking = bookingService.getBookingById(request.getBookingId());
        User customer = userRepository.findById(booking.getUserId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        if (!Boolean.TRUE.equals(customer.getWalkInCustomer())) {
            throw new BusinessException("BOOKING_CONFLICT", "Only walk-in bookings can use the in-store return flow");
        }

        bookingService.completeBooking(
                request.getBookingId(),
                Boolean.TRUE.equals(request.getDamaged()),
                request.getDamageDescription(),
                request.getDamageImageUrl(),
                request.getDamageLevel(),
                customer.getUserId().toString());
        Booking completedBooking = bookingService.getBookingById(request.getBookingId());

        return WalkInReturnResponse.builder()
                .bookingId(completedBooking.getId().toString())
                .bookingStatus(completedBooking.getStatus().name())
                .scooterStatus(ScooterStatus.AVAILABLE.name())
                .totalCost(completedBooking.getTotalPrice() != null ? completedBooking.getTotalPrice().toString() : null)
                .baseRentalFee(
                        completedBooking.getBaseRentalFee() != null ? completedBooking.getBaseRentalFee().toString()
                                : null)
                .overtimeFee(
                        completedBooking.getOvertimeFee() != null ? completedBooking.getOvertimeFee().toString() : null)
                .batteryUsageFee(completedBooking.getBatteryUsageFee() != null
                        ? completedBooking.getBatteryUsageFee().toString()
                        : null)
                .damageFee(
                        completedBooking.getDamageFee() != null ? completedBooking.getDamageFee().toString() : null)
                .pickupBatteryLevel(completedBooking.getPickupBatteryLevel())
                .returnBatteryLevel(completedBooking.getReturnBatteryLevel())
                .batteryLevelDelta(completedBooking.getPickupBatteryLevel() != null
                        && completedBooking.getReturnBatteryLevel() != null
                                ? completedBooking.getPickupBatteryLevel() - completedBooking.getReturnBatteryLevel()
                                : null)
                .overtimeMinutes(completedBooking.getOvertimeMinutes())
                .batteryUsagePercent(completedBooking.getBatteryUsagePercent())
                .damageReported(completedBooking.getDamageReported())
                .build();
    }

    private User getWalkInCustomer(UUID customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Customer not found"));

        if (!Boolean.TRUE.equals(customer.getWalkInCustomer())) {
            throw new BusinessException("USER_CONFLICT", "Customer is not a walk-in customer");
        }

        return customer;
    }

    private String generateWalkInEmail() {
        return "walkin+" + UUID.randomUUID() + "@local.staff";
    }
}
