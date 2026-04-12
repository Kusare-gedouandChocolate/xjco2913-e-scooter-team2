package com.scooter.modules.booking.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.booking.dto.BookingCreateResponse;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.dto.BookingResponse;
import com.scooter.modules.payment.dto.PaymentRequest; // New Import
import com.scooter.modules.payment.entity.Payment;
import com.scooter.modules.payment.entity.PaymentStatus;
import com.scooter.modules.payment.repository.PaymentRepository;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.confirmation.entity.BookingConfirmation; // New Import
import com.scooter.modules.confirmation.repository.ConfirmationRepository; // New Import
import com.scooter.modules.discount.service.DiscountRuleService;
import com.scooter.modules.discount.service.DiscountRuleService.AppliedDiscount;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.ScooterRepository;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.UUID;

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
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DiscountRuleService discountRuleService;
    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Issue #6: Create a new booking
     */
    @Transactional
    public BookingCreateResponse createBooking(String userId, BookingRequest request) {
        Long scooterId = Objects.requireNonNull(request.getScooterId(), "Scooter ID must not be null");
        Long rentalOptionId = Objects.requireNonNull(request.getRentalOptionId(), "Rental option ID must not be null");

        Scooter scooter = scooterRepository.findById(scooterId)
                .orElseThrow(() -> new BusinessException("SCOOTER_NOT_FOUND", "Scooter not found"));

        if (scooter.getStatus() != ScooterStatus.AVAILABLE) {
            throw new BusinessException("SCOOTER_CONFLICT", "Scooter is not available");
        }

        RentalOption option = rentalOptionRepository.findById(rentalOptionId)
                .orElseThrow(() -> new BusinessException("RENTAL_OPTION_NOT_FOUND", "Rental option not found"));
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        AppliedDiscount appliedDiscount = discountRuleService.resolveBestDiscount(user);
        BigDecimal originalPrice = option.getPrice();
        BigDecimal discountAmount = discountRuleService.calculateDiscountAmount(originalPrice, appliedDiscount);
        BigDecimal finalPrice = originalPrice.subtract(discountAmount);

        scooter.setStatus(ScooterStatus.LOCKED);
        scooterRepository.save(scooter);

        Booking booking = new Booking();
        booking.setUserId(UUID.fromString(userId));
        booking.setScooter(scooter);
        booking.setRentalOption(option);

        booking.setOriginalPrice(originalPrice);
        booking.setDiscountAmount(discountAmount);
        booking.setAppliedDiscountType(appliedDiscount.ruleType());
        booking.setAppliedDiscountRate(appliedDiscount.discountRate());
        booking.setTotalPrice(finalPrice);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);

        booking.setStartTime(resolveStartTime(request));

        Booking saved = bookingRepository.save(booking);

        BookingCreateResponse resp = new BookingCreateResponse();
        resp.setBookingId(saved.getId().toString());
        resp.setStatus(mapBookingStatusToCamelCase(saved.getStatus()));
        resp.setOriginalCost(saved.getOriginalPrice() != null ? saved.getOriginalPrice().toString() : null);
        resp.setDiscountAmount(saved.getDiscountAmount() != null ? saved.getDiscountAmount().toString() : null);
        resp.setAppliedDiscountType(saved.getAppliedDiscountType());
        resp.setAppliedDiscountRate(saved.getAppliedDiscountRate() != null ? saved.getAppliedDiscountRate().toString() : null);
        resp.setTotalCost(saved.getTotalPrice() != null ? saved.getTotalPrice().toString() : null);
        return resp;
    }

    /**
     * Issue #7: Process mock payment and generate confirmation
     */
    @Transactional
    public BookingConfirmation processPayment(PaymentRequest request) {
        // 1. Fetch booking and validate
        Long bookingId = Objects.requireNonNull(request.getBookingId(), "Booking ID must not be null");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BusinessException("BOOKING_CONFLICT", "Booking is not in a payable state");
        }

        // 2. Mock payment logic
        if (Boolean.FALSE.equals(request.getSimulateSuccess())) {
            // If payment fails, we could unlock the scooter or keep it pending.
            // For Sprint 1, we'll throw an exception to trigger rollback.
            throw new BusinessException("PAYMENT_FAILED", "Payment failed: Transaction rejected by mock provider");
        }

        // 3. Update Booking Status
        booking.setStatus(BookingStatus.PAID);
        bookingRepository.save(booking);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setUserId(booking.getUserId().toString());
        payment.setAmount(booking.getTotalPrice());
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CREDIT_CARD");
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setTransactionNo("TXN-" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // 4. Update Scooter Status to IN_USE
        Scooter scooter = booking.getScooter();
        scooter.setStatus(ScooterStatus.IN_USE);
        scooterRepository.save(scooter);

        // 5. Create Confirmation Record
        BookingConfirmation confirmation = new BookingConfirmation();
        confirmation.setBookingId(booking.getId());
        confirmation.setConfirmationNumber("CONF-" + System.currentTimeMillis());
        confirmation.setConfirmedAt(LocalDateTime.now());

        return confirmationRepository.save(confirmation);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> findByUserId(String userIdStr, String sortBy, String sortOrder) {
        UUID userId = UUID.fromString(userIdStr);

        Sort sort = sortOrder.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        List<Booking> bookings = bookingRepository.findByUserId(userId, sort);

        return bookings.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.PAID) {
            throw new BusinessException("BOOKING_CONFLICT", "Booking cannot be cancelled in current status");
        }

        Scooter scooter = booking.getScooter();
        scooter.setStatus(ScooterStatus.AVAILABLE);
        scooterRepository.save(scooter);

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    @Transactional
    public void completeBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PAID) {
            throw new BusinessException("BOOKING_CONFLICT", "Only paid bookings can be completed");
        }

        Scooter scooter = booking.getScooter();
        scooter.setStatus(ScooterStatus.AVAILABLE);
        scooterRepository.save(scooter);

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        bookingRepository.save(booking);
    }

    private BookingResponse convertToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();

        response.setBookingId(booking.getId() == null ? null : booking.getId().toString());

        if (booking.getScooter() != null) {
            response.setScooterId(String.valueOf(booking.getScooter().getId()));
            response.setScooterName(booking.getScooter().getModel());
        }

        if (booking.getRentalOption() != null) {
            response.setHireType(booking.getRentalOption().getDurationLabel());
        }

        if (booking.getStartTime() != null) {
            response.setStartTime(booking.getStartTime().toString());
            if (booking.getRentalOption() != null && booking.getRentalOption().getDurationHours() != null) {
                response.setEndTime(
                        booking.getStartTime().plusHours(booking.getRentalOption().getDurationHours()).toString());
            }
        }

        if (booking.getStatus() != null) {
            response.setStatus(mapBookingStatusToCamelCase(booking.getStatus()));
        }

        response.setTotalCost(booking.getTotalPrice() != null ? booking.getTotalPrice().toString() : null);
        response.setOriginalCost(booking.getOriginalPrice() != null ? booking.getOriginalPrice().toString() : null);
        response.setDiscountAmount(booking.getDiscountAmount() != null ? booking.getDiscountAmount().toString() : null);
        response.setAppliedDiscountType(booking.getAppliedDiscountType());
        response.setAppliedDiscountRate(
                booking.getAppliedDiscountRate() != null ? booking.getAppliedDiscountRate().toString() : null);

        return response;
    }

    private LocalDateTime resolveStartTime(BookingRequest request) {
        return request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now();
    }

    private String mapBookingStatusToCamelCase(BookingStatus status) {
        switch (status) {
            case PENDING_PAYMENT:
                return "PENDING_PAYMENT";
            case PAID:
                return "PAID";
            case CANCELLED:
                return "CANCELLED";
            case COMPLETED:
                return "COMPLETED";
            default:
                return status.name();
        }
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));
    }
}
