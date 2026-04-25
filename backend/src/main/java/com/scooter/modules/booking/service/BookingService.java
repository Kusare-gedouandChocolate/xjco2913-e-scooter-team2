package com.scooter.modules.booking.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.booking.dto.BookingCreateResponse;
import com.scooter.modules.booking.dto.BookingRequest;
import com.scooter.modules.booking.dto.BookingResponse;
import com.scooter.modules.booking.dto.PickupVerificationResponse;
import com.scooter.modules.payment.dto.PaymentRequest; // New Import
import com.scooter.modules.payment.entity.Payment;
import com.scooter.modules.payment.entity.PaymentStatus;
import com.scooter.modules.payment.repository.PaymentRepository;
import com.scooter.modules.payment.service.CardTokenService;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.confirmation.entity.BookingConfirmation; // New Import
import com.scooter.modules.confirmation.repository.ConfirmationRepository; // New Import
import com.scooter.modules.damage.entity.DamageEvent;
import com.scooter.modules.damage.entity.DamageLevel;
import com.scooter.modules.damage.repository.DamageEventRepository;
import com.scooter.modules.damage.service.DamageBillingService;
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
import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class BookingService {

    private static final Duration PICKUP_CODE_VALIDITY = Duration.ofHours(2);
    private static final int PICKUP_CODE_LENGTH = 6;
    private static final Random PICKUP_CODE_RANDOM = new Random();

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
    @Autowired
    private CardTokenService cardTokenService;
    @Autowired
    private BookingBillingService bookingBillingService;
    @Autowired
    private DamageBillingService damageBillingService;
    @Autowired
    private DamageEventRepository damageEventRepository;

    /**
     * Issue #6: Create a new booking
     */
    @Transactional
    public BookingCreateResponse createBooking(String userId, BookingRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        Booking saved = createBookingEntity(user, request);
        return toCreateResponse(saved);
    }

    @Transactional
    public BookingCreateResponse createBookingForUser(UUID userId, BookingRequest request) {
        User user = userRepository.findById(Objects.requireNonNull(userId, "User ID must not be null"))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        Booking saved = createBookingEntity(user, request);
        return toCreateResponse(saved);
    }

    @Transactional
    public BookingConfirmation processPayment(PaymentRequest request) {
        Booking booking = getPayableBooking(request.getBookingId());
        User user = userRepository.findById(booking.getUserId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CREDIT_CARD";
        boolean shouldValidateCardToken = "CREDIT_CARD".equalsIgnoreCase(paymentMethod)
                && (Boolean.TRUE.equals(user.getWalkInCustomer())
                        || (request.getCardToken() != null && !request.getCardToken().isBlank()));
        if (shouldValidateCardToken) {
            String resolvedCardToken = Boolean.TRUE.equals(user.getWalkInCustomer())
                    ? cardTokenService.resolveBoundCardToken(user, request.getCardToken())
                    : validateAndBindCardToken(user, request.getCardToken());
            user.setCardToken(resolvedCardToken);
            userRepository.save(user);
        }

        if (Boolean.FALSE.equals(request.getSimulateSuccess())) {
            throw new BusinessException("PAYMENT_FAILED", "Payment failed: Transaction rejected by mock provider");
        }

        String pickupCode = generatePickupCode();
        LocalDateTime pickupCodeExpiresAt = LocalDateTime.now().plus(PICKUP_CODE_VALIDITY);

        booking.setStatus(BookingStatus.AWAITING_PICKUP);
        booking.setPickupCode(pickupCode);
        booking.setPickupCodeExpiresAt(pickupCodeExpiresAt);
        booking.setPickedUpAt(null);
        bookingRepository.save(booking);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setUserId(booking.getUserId().toString());
        payment.setAmount(booking.getTotalPrice());
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setTransactionNo("TXN-" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        BookingConfirmation confirmation = new BookingConfirmation();
        confirmation.setBookingId(booking.getId());
        confirmation.setConfirmationNumber("CONF-" + System.currentTimeMillis());
        confirmation.setConfirmedAt(LocalDateTime.now());
        confirmation.setPickupCode(pickupCode);
        confirmation.setPickupCodeExpiresAt(pickupCodeExpiresAt);

        return confirmationRepository.save(confirmation);
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT
                && booking.getStatus() != BookingStatus.AWAITING_PICKUP) {
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
        completeBooking(bookingId, false, null, null, null, null);
    }

    @Transactional
    public void completeBooking(Long bookingId, boolean damaged, String damageDescription, String damageImageUrl,
            DamageLevel damageLevel, String reportedByUserId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new BusinessException("BOOKING_CONFLICT", "Only rentals in progress can be completed");
        }

        Scooter scooter = booking.getScooter();
        booking.setReturnBatteryLevel(normalizeBatteryLevel(scooter.getBatteryLevel()));
        scooter.setStatus(ScooterStatus.AVAILABLE);
        scooterRepository.save(scooter);

        applyDamageInfo(booking, damaged, damageDescription, damageImageUrl, damageLevel, reportedByUserId);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        applyBillingBreakdown(booking);
        bookingRepository.save(booking);
        syncPaymentAmount(booking);
    }

    @Transactional
    public PickupVerificationResponse verifyPickupCode(Long bookingId, String pickupCode) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        activatePickup(booking, pickupCode, true);
        return PickupVerificationResponse.builder()
                .bookingId(booking.getId().toString())
                .status(mapBookingStatusToCamelCase(booking.getStatus()))
                .scooterStatus(booking.getScooter().getStatus().name())
                .pickedUpAt(booking.getPickedUpAt() != null ? booking.getPickedUpAt().toString() : null)
                .pickupBatteryLevel(booking.getPickupBatteryLevel())
                .build();
    }

    @Transactional
    public void activateWalkInPickup(Long bookingId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));
        activatePickup(booking, null, false);
    }

    private Booking createBookingEntity(User user, BookingRequest request) {
        Long scooterId = Objects.requireNonNull(request.getScooterId(), "Scooter ID must not be null");
        Long rentalOptionId = Objects.requireNonNull(request.getRentalOptionId(), "Rental option ID must not be null");

        Scooter scooter = scooterRepository.findById(scooterId)
                .orElseThrow(() -> new BusinessException("SCOOTER_NOT_FOUND", "Scooter not found"));

        if (scooter.getStatus() != ScooterStatus.AVAILABLE) {
            throw new BusinessException("SCOOTER_CONFLICT", "Scooter is not available");
        }

        RentalOption option = rentalOptionRepository.findById(rentalOptionId)
                .orElseThrow(() -> new BusinessException("RENTAL_OPTION_NOT_FOUND", "Rental option not found"));
        AppliedDiscount appliedDiscount = discountRuleService.resolveBestDiscount(user);
        BigDecimal originalPrice = option.getPrice();
        BigDecimal discountAmount = discountRuleService.calculateDiscountAmount(originalPrice, appliedDiscount);
        BigDecimal finalPrice = originalPrice.subtract(discountAmount);

        scooter.setStatus(ScooterStatus.LOCKED);
        scooterRepository.save(scooter);

        Booking booking = new Booking();
        booking.setUserId(user.getUserId());
        booking.setScooter(scooter);
        booking.setRentalOption(option);

        booking.setOriginalPrice(originalPrice);
        booking.setDiscountAmount(discountAmount);
        booking.setAppliedDiscountType(appliedDiscount.ruleType());
        booking.setAppliedDiscountRate(appliedDiscount.discountRate());
        booking.setBaseRentalFee(finalPrice);
        booking.setOvertimeFee(BigDecimal.ZERO.setScale(2));
        booking.setBatteryUsageFee(BigDecimal.ZERO.setScale(2));
        booking.setDamageFee(BigDecimal.ZERO.setScale(2));
        booking.setOvertimeMinutes(0L);
        booking.setBatteryUsagePercent(0);
        booking.setDamageReported(Boolean.FALSE);
        booking.setTotalPrice(finalPrice);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.PENDING_PAYMENT);

        booking.setStartTime(resolveStartTime(request));

        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> findByUserId(String userIdStr, String sortBy, String sortOrder) {
        UUID userId = UUID.fromString(userIdStr);

        Sort sort = sortOrder.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        List<Booking> bookings = bookingRepository.findByUserId(userId, sort);

        return bookings.stream().map(this::convertToResponse).collect(Collectors.toList());
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
        response.setBaseRentalFee(booking.getBaseRentalFee() != null ? booking.getBaseRentalFee().toString() : null);
        response.setOvertimeFee(booking.getOvertimeFee() != null ? booking.getOvertimeFee().toString() : null);
        response.setBatteryUsageFee(
                booking.getBatteryUsageFee() != null ? booking.getBatteryUsageFee().toString() : null);
        response.setDamageFee(booking.getDamageFee() != null ? booking.getDamageFee().toString() : null);
        response.setAppliedDiscountType(booking.getAppliedDiscountType());
        response.setAppliedDiscountRate(
                booking.getAppliedDiscountRate() != null ? booking.getAppliedDiscountRate().toString() : null);
        response.setPickupCode(booking.getPickupCode());
        response.setPickupCodeExpiresAt(
                booking.getPickupCodeExpiresAt() != null ? booking.getPickupCodeExpiresAt().toString() : null);
        response.setPickupBatteryLevel(booking.getPickupBatteryLevel());
        response.setReturnBatteryLevel(booking.getReturnBatteryLevel());
        response.setBatteryLevelDelta(calculateBatteryLevelDelta(booking));
        response.setOvertimeMinutes(booking.getOvertimeMinutes());
        response.setBatteryUsagePercent(booking.getBatteryUsagePercent());
        response.setDamageReported(booking.getDamageReported());

        return response;
    }

    private LocalDateTime resolveStartTime(BookingRequest request) {
        return request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now();
    }

    private Booking getPayableBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BusinessException("BOOKING_CONFLICT", "Booking is not in a payable state");
        }

        return booking;
    }

    private void activatePickup(Booking booking, String pickupCode, boolean requireCodeMatch) {
        if (booking.getStatus() != BookingStatus.AWAITING_PICKUP) {
            throw new BusinessException("BOOKING_CONFLICT", "Booking is not awaiting pickup");
        }

        if (booking.getPickupCode() == null || booking.getPickupCodeExpiresAt() == null) {
            throw new BusinessException("PICKUP_CODE_INVALID", "Pickup code has not been generated for this booking");
        }

        if (booking.getPickupCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("PICKUP_CODE_EXPIRED", "Pickup code has expired");
        }

        if (requireCodeMatch) {
            String normalizedCode = pickupCode == null ? "" : pickupCode.trim();
            if (!booking.getPickupCode().equals(normalizedCode)) {
                throw new BusinessException("PICKUP_CODE_INVALID", "Pickup code is invalid");
            }
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setPickedUpAt(LocalDateTime.now());
        booking.setPickupBatteryLevel(normalizeBatteryLevel(booking.getScooter().getBatteryLevel()));
        bookingRepository.save(booking);

        Scooter scooter = booking.getScooter();
        scooter.setStatus(ScooterStatus.IN_USE);
        scooterRepository.save(scooter);
    }

    private BookingCreateResponse toCreateResponse(Booking saved) {
        BookingCreateResponse resp = new BookingCreateResponse();
        resp.setBookingId(saved.getId().toString());
        resp.setStatus(mapBookingStatusToCamelCase(saved.getStatus()));
        resp.setOriginalCost(saved.getOriginalPrice() != null ? saved.getOriginalPrice().toString() : null);
        resp.setDiscountAmount(saved.getDiscountAmount() != null ? saved.getDiscountAmount().toString() : null);
        resp.setBaseRentalFee(saved.getBaseRentalFee() != null ? saved.getBaseRentalFee().toString() : null);
        resp.setOvertimeFee(saved.getOvertimeFee() != null ? saved.getOvertimeFee().toString() : null);
        resp.setBatteryUsageFee(saved.getBatteryUsageFee() != null ? saved.getBatteryUsageFee().toString() : null);
        resp.setDamageFee(saved.getDamageFee() != null ? saved.getDamageFee().toString() : null);
        resp.setAppliedDiscountType(saved.getAppliedDiscountType());
        resp.setAppliedDiscountRate(
                saved.getAppliedDiscountRate() != null ? saved.getAppliedDiscountRate().toString() : null);
        resp.setTotalCost(saved.getTotalPrice() != null ? saved.getTotalPrice().toString() : null);
        resp.setPickupCode(saved.getPickupCode());
        resp.setPickupCodeExpiresAt(
                saved.getPickupCodeExpiresAt() != null ? saved.getPickupCodeExpiresAt().toString() : null);
        resp.setPickupBatteryLevel(saved.getPickupBatteryLevel());
        resp.setReturnBatteryLevel(saved.getReturnBatteryLevel());
        resp.setBatteryLevelDelta(calculateBatteryLevelDelta(saved));
        resp.setOvertimeMinutes(saved.getOvertimeMinutes());
        resp.setBatteryUsagePercent(saved.getBatteryUsagePercent());
        resp.setDamageReported(saved.getDamageReported());
        return resp;
    }

    private String mapBookingStatusToCamelCase(BookingStatus status) {
        switch (status) {
            case PENDING_PAYMENT:
                return "PENDING_PAYMENT";
            case AWAITING_PICKUP:
                return "AWAITING_PICKUP";
            case IN_PROGRESS:
                return "IN_PROGRESS";
            case CANCELLED:
                return "CANCELLED";
            case COMPLETED:
                return "COMPLETED";
            default:
                return status.name();
        }
    }

    private String generatePickupCode() {
        int value = PICKUP_CODE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(value);
    }

    private Integer calculateBatteryLevelDelta(Booking booking) {
        if (booking.getPickupBatteryLevel() == null || booking.getReturnBatteryLevel() == null) {
            return null;
        }
        return booking.getPickupBatteryLevel() - booking.getReturnBatteryLevel();
    }

    private Integer normalizeBatteryLevel(Integer batteryLevel) {
        if (batteryLevel == null) {
            return null;
        }
        return Math.max(0, Math.min(100, batteryLevel));
    }

    private String validateAndBindCardToken(User user, String cardToken) {
        if (cardToken != null && !cardToken.isBlank()) {
            cardTokenService.validateCardTokenOrThrow(cardToken);
            return cardToken.trim();
        }
        return user.getCardToken();
    }

    private void applyBillingBreakdown(Booking booking) {
        BookingBillingService.ChargeBreakdown breakdown = bookingBillingService.calculateBreakdown(booking);
        booking.setBaseRentalFee(breakdown.baseRentalFee());
        booking.setOvertimeFee(breakdown.overtimeFee());
        booking.setBatteryUsageFee(breakdown.batteryUsageFee());
        booking.setDamageFee(breakdown.damageFee());
        booking.setOvertimeMinutes(breakdown.overtimeMinutes());
        booking.setBatteryUsagePercent(breakdown.batteryUsagePercent());
        booking.setTotalPrice(breakdown.totalFee());
    }

    private void applyDamageInfo(Booking booking, boolean damaged, String damageDescription, String damageImageUrl,
            DamageLevel damageLevel, String reportedByUserId) {
        if (!damaged) {
            booking.setDamageReported(Boolean.FALSE);
            booking.setDamageFee(BigDecimal.ZERO.setScale(2));
            return;
        }

        String normalizedDescription = damageDescription == null ? "" : damageDescription.trim();
        if (normalizedDescription.isEmpty()) {
            throw new BusinessException("DAMAGE_DESCRIPTION_REQUIRED",
                    "Damage description is required when damage is reported");
        }

        BigDecimal damageFee = damageBillingService.calculateDamageFee(true, damageLevel);
        booking.setDamageReported(Boolean.TRUE);
        booking.setDamageFee(damageFee);

        DamageEvent damageEvent = damageEventRepository.findByBookingId(booking.getId()).orElseGet(DamageEvent::new);
        damageEvent.setBookingId(booking.getId());
        damageEvent.setScooterId(booking.getScooter().getId());
        damageEvent.setReportedByUserId(reportedByUserId);
        damageEvent.setDamageLevel(damageLevel);
        damageEvent.setDescription(normalizedDescription);
        damageEvent.setImageUrl(normalizeOptionalText(damageImageUrl));
        damageEvent.setDamageFee(damageFee);
        damageEventRepository.save(damageEvent);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void syncPaymentAmount(Booking booking) {
        paymentRepository.findByBooking_Id(booking.getId()).ifPresent(payment -> {
            payment.setAmount(booking.getTotalPrice());
            paymentRepository.save(payment);
        });
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));
    }
}
