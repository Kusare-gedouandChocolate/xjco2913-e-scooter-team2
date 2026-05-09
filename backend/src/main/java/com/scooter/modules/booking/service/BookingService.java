package com.scooter.modules.booking.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.web.RequestContext;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.booking.dto.*;
import com.scooter.modules.payment.dto.PaymentRequest;
import com.scooter.modules.payment.entity.Payment;
import com.scooter.modules.payment.entity.PaymentStatus;
import com.scooter.modules.payment.repository.PaymentRepository;
import com.scooter.modules.payment.service.CardTokenService;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.confirmation.entity.BookingConfirmation;
import com.scooter.modules.confirmation.repository.ConfirmationRepository;
import com.scooter.modules.damage.entity.DamageEvent;
import com.scooter.modules.damage.entity.DamageLevel;
import com.scooter.modules.damage.repository.DamageEventRepository;
import com.scooter.modules.damage.service.DamageBillingService;
import com.scooter.modules.discount.service.DiscountRuleService;
import com.scooter.modules.discount.service.DiscountRuleService.AppliedDiscount;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final Duration PICKUP_CODE_VALIDITY = Duration.ofHours(2);
    private static final int PICKUP_CODE_LENGTH = 6;
    private static final Random PICKUP_CODE_RANDOM = new Random();
    private static final String DEFAULT_PAYMENT_METHOD = "CREDIT_CARD";

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ScooterRepository scooterRepository;
    @Autowired
    private RentalOptionRepository rentalOptionRepository;
    @Autowired
    private ConfirmationRepository confirmationRepository;
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
        log.info("requestId={} bookingCreated bookingId={} userId={} scooterId={} status={}",
                RequestContext.getOrCreateRequestId(), saved.getId(), user.getUserId(),
                saved.getScooter().getId(), saved.getStatus());
        return toCreateResponse(saved);
    }

    @Transactional
    public BookingCreateResponse createBookingForUser(UUID userId, BookingRequest request) {
        User user = userRepository.findById(Objects.requireNonNull(userId, "User ID must not be null"))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        Booking saved = createBookingEntity(user, request);
        log.info("requestId={} bookingCreatedForUser bookingId={} userId={} scooterId={} status={}",
                RequestContext.getOrCreateRequestId(), saved.getId(), user.getUserId(),
                saved.getScooter().getId(), saved.getStatus());
        return toCreateResponse(saved);
    }

    @Transactional
    public BookingConfirmation processPayment(PaymentRequest request) {
        Booking booking = getPayableBooking(request.getBookingId());
        User user = userRepository.findById(booking.getUserId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        String paymentMethod = normalizePaymentMethod(request.getPaymentMethod());
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

        BookingConfirmation savedConfirmation = confirmationRepository.save(confirmation);
        log.info("requestId={} bookingPaid bookingId={} fromStatus=PENDING_PAYMENT toStatus={} paymentMethod={} confirmationNumber={}",
                RequestContext.getOrCreateRequestId(), booking.getId(), booking.getStatus(),
                paymentMethod, savedConfirmation.getConfirmationNumber());
        return savedConfirmation;
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT
                && booking.getStatus() != BookingStatus.AWAITING_PICKUP) {
            throw new BusinessException("BOOKING_CONFLICT", "Booking cannot be cancelled in current status");
        }

        Scooter scooter = getScooterForUpdate(booking.getScooter().getId());
        BookingStatus previousStatus = booking.getStatus();
        scooter.setStatus(ScooterStatus.AVAILABLE);
        scooterRepository.save(scooter);

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        log.info("requestId={} bookingCancelled bookingId={} fromStatus={} toStatus={} scooterId={}",
                RequestContext.getOrCreateRequestId(), booking.getId(), previousStatus, booking.getStatus(), scooter.getId());
    }

    @Transactional
    public void completeBooking(Long bookingId) {
        completeBooking(bookingId, false, null, null, null, null);
    }

    @Transactional
    public void completeBooking(Long bookingId, boolean damaged, String damageDescription, String damageImageUrl,
            DamageLevel damageLevel, String reportedByUserId) {
        Booking booking = bookingRepository.findByIdForUpdate(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new BusinessException("BOOKING_CONFLICT", "Only rentals in progress can be completed");
        }

        Scooter scooter = getScooterForUpdate(booking.getScooter().getId());
        BookingStatus previousStatus = booking.getStatus();
        booking.setReturnBatteryLevel(normalizeBatteryLevel(scooter.getBatteryLevel()));
        scooter.setStatus(ScooterStatus.AVAILABLE);
        scooterRepository.save(scooter);

        applyDamageInfo(booking, damaged, damageDescription, damageImageUrl, damageLevel, reportedByUserId);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        applyBillingBreakdown(booking);
        bookingRepository.save(booking);
        syncPaymentAmount(booking);
        log.info("requestId={} bookingCompleted bookingId={} fromStatus={} toStatus={} scooterId={} pickupBattery={} returnBattery={} totalFee={}",
                RequestContext.getOrCreateRequestId(), booking.getId(), previousStatus, booking.getStatus(),
                scooter.getId(), booking.getPickupBatteryLevel(), booking.getReturnBatteryLevel(), booking.getTotalPrice());
    }

    @Transactional
    public PickupVerificationResponse verifyPickupCode(Long bookingId, String pickupCode) {
        Booking booking = bookingRepository.findByIdForUpdate(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
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
        Booking booking = bookingRepository.findByIdForUpdate(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));
        activatePickup(booking, null, false);
    }

    private Booking createBookingEntity(User user, BookingRequest request) {
        Long scooterId = Objects.requireNonNull(request.getScooterId(), "Scooter ID must not be null");
        Long rentalOptionId = Objects.requireNonNull(request.getRentalOptionId(), "Rental option ID must not be null");

        validateBookingRequest(request);

        Scooter scooter = scooterRepository.findByIdForUpdate(scooterId)
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
            response.setScooterStatus(booking.getScooter().getStatus() != null
                    ? booking.getScooter().getStatus().name()
                    : null);
            response.setScooterBatteryLevel(booking.getScooter().getBatteryLevel());
        }

        if (booking.getRentalOption() != null) {
            response.setHireType(booking.getRentalOption().getDurationLabel());
            response.setDurationHours(booking.getRentalOption().getDurationHours());
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

        response.setPickedUpAt(booking.getPickedUpAt() != null ? booking.getPickedUpAt().toString() : null);
        response.setCompletedAt(booking.getCompletedAt() != null ? booking.getCompletedAt().toString() : null);
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
        if (request.getStartTime() == null) {
            return LocalDateTime.now();
        }
        if (request.getStartTime().isBefore(LocalDateTime.now().minusDays(1))) {
            throw new BusinessException("INVALID_REQUEST_PARAMETER", "Start time is too far in the past");
        }
        return request.getStartTime();
    }

    private Booking getPayableBooking(Long bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
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

        Scooter scooter = getScooterForUpdate(booking.getScooter().getId());
        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setPickedUpAt(LocalDateTime.now());
        booking.setPickupBatteryLevel(normalizeBatteryLevel(scooter.getBatteryLevel()));
        bookingRepository.save(booking);

        scooter.setStatus(ScooterStatus.IN_USE);
        scooterRepository.save(scooter);
        log.info("requestId={} bookingPickupActivated bookingId={} fromStatus={} toStatus={} scooterId={} pickupBattery={}",
                RequestContext.getOrCreateRequestId(), booking.getId(), previousStatus, booking.getStatus(),
                scooter.getId(), booking.getPickupBatteryLevel());
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
        int minValue = (int) Math.pow(10, PICKUP_CODE_LENGTH - 1);
        int maxDelta = (int) Math.pow(10, PICKUP_CODE_LENGTH) - minValue;
        int value = PICKUP_CODE_RANDOM.nextInt(maxDelta) + minValue;
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

    private void validateBookingRequest(BookingRequest request) {
        if (request.getScooterId() != null && request.getScooterId() <= 0) {
            throw new BusinessException("INVALID_REQUEST_PARAMETER", "Scooter ID must be a positive number");
        }
        if (request.getRentalOptionId() != null && request.getRentalOptionId() <= 0) {
            throw new BusinessException("INVALID_REQUEST_PARAMETER", "Rental option ID must be a positive number");
        }
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return DEFAULT_PAYMENT_METHOD;
        }

        String normalized = paymentMethod.trim().toUpperCase();
        if (!normalized.equals("CREDIT_CARD")
                && !normalized.equals("CARD_ON_FILE")
                && !normalized.equals("WALLET")) {
            throw new BusinessException("INVALID_REQUEST_PARAMETER",
                    "Unsupported payment method. Expected CREDIT_CARD, CARD_ON_FILE, or WALLET");
        }
        return normalized;
    }

    private Scooter getScooterForUpdate(Long scooterId) {
        return scooterRepository.findByIdForUpdate(scooterId)
                .orElseThrow(() -> new BusinessException("SCOOTER_NOT_FOUND", "Scooter not found"));
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

    private void applyDamageInfo(Booking booking, boolean damaged, String damageDescription,
                                 String damageImageUrl, DamageLevel damageLevel, String reportedByUserId) {
        if (!damaged) {
            booking.setDamageReported(Boolean.FALSE);
            booking.setDamageFee(BigDecimal.ZERO.setScale(2));
            return;
        }

        java.util.Optional<DamageEvent> existing = damageEventRepository.findByBookingId(booking.getId());
        if (existing.isPresent()) {
            booking.setDamageReported(Boolean.TRUE);
            booking.setDamageFee(existing.get().getDamageFee());
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

        DamageEvent damageEvent = new DamageEvent();
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

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId) {
        return convertToResponse(getBookingEntityById(bookingId));
    }

    @Transactional(readOnly = true)
    public Booking getBookingEntityById(Long bookingId) {
        return bookingRepository.findById(Objects.requireNonNull(bookingId, "Booking ID must not be null"))
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));
    }

    @Transactional
    public BookingResponse processReturn(Long bookingId, ReturnRequest request) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new BusinessException("BOOKING_CONFLICT", "Only rentals in progress can be returned");
        }

        Scooter scooter = getScooterForUpdate(booking.getScooter().getId());
        if (request.getBatteryLevelAtReturn() != null) {
            booking.setReturnBatteryLevel(request.getBatteryLevelAtReturn());
        } else {
            booking.setReturnBatteryLevel(scooter.getBatteryLevel());
        }

        boolean isDamaged = damageEventRepository.findByBookingId(bookingId).isPresent();
        if (isDamaged) {
            booking.setDamageReported(true);
        }

        completeBooking(bookingId, isDamaged, null, null, null, null);

        return convertToResponse(bookingRepository.findById(bookingId).get());
    }

    @Transactional
    public void reportDamage(Long bookingId, DamageReportRequest request) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new BusinessException("BOOKING_CONFLICT", "Damage can only be reported during an active rental");
        }

        DamageEvent existing = damageEventRepository.findByBookingId(bookingId).orElse(null);
        boolean updatedExisting = existing != null;
        if (existing != null) {
            existing.setDescription(request.getDescription().trim());
            if (request.getEstimatedFeeInCents() != null) {
                existing.setDamageFee(BigDecimal.valueOf(request.getEstimatedFeeInCents()).setScale(2));
            }
            damageEventRepository.save(existing);
        } else {
            DamageEvent event = new DamageEvent();
            event.setBookingId(bookingId);
            event.setScooterId(booking.getScooter().getId());
            event.setReportedByUserId(booking.getUserId().toString());
            event.setDamageLevel(DamageLevel.MEDIUM);
            event.setDescription(request.getDescription().trim());
            BigDecimal fee = request.getEstimatedFeeInCents() != null
                    ? BigDecimal.valueOf(request.getEstimatedFeeInCents()).setScale(2)
                    : damageBillingService.calculateDamageFee(true, DamageLevel.MEDIUM);
            event.setDamageFee(fee);
            damageEventRepository.save(event);
        }
        log.info("requestId={} damageReported bookingId={} damaged=true estimatedFee={} existingEvent={}",
                RequestContext.getOrCreateRequestId(), bookingId, request.getEstimatedFeeInCents(), updatedExisting);
    }

    @Transactional(readOnly = true)
    public SettlementResponse getSettlement(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Booking not found"));

        BookingBillingService.ChargeBreakdown breakdown = bookingBillingService.calculateBreakdown(booking);

        String damageStatus = "none";
        if (Boolean.TRUE.equals(booking.getDamageReported())) {
            damageStatus = "confirmed";
        } else if (damageEventRepository.findByBookingId(bookingId).isPresent()) {
            damageStatus = "reported";
        }

        return SettlementResponse.builder()
                .bookingId(booking.getId().toString())
                .batteryLevelAtCheckout(booking.getPickupBatteryLevel())
                .batteryLevelAtReturn(booking.getReturnBatteryLevel())
                .overtimeMinutes(breakdown.overtimeMinutes())
                .damageStatus(damageStatus)
                .fees(SettlementResponse.FeeBreakdown.builder()
                        .baseFeeInCents(toStringCents(breakdown.baseRentalFee()))
                        .overtimeFeeInCents(toStringCents(breakdown.overtimeFee()))
                        .batteryDeltaFeeInCents(toStringCents(breakdown.batteryUsageFee()))
                        .damageFeeInCents(toStringCents(breakdown.damageFee()))
                        .totalInCents(toStringCents(breakdown.totalFee()))
                        .build())
                .build();
    }

    private String toStringCents(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0).toPlainString(); // 转为分
    }
}
