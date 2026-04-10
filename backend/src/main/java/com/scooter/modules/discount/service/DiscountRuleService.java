package com.scooter.modules.discount.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.discount.dto.DiscountRuleRequest;
import com.scooter.modules.discount.dto.DiscountRuleResponse;
import com.scooter.modules.discount.dto.DiscountRuleStatusRequest;
import com.scooter.modules.discount.entity.DiscountRule;
import com.scooter.modules.discount.entity.DiscountRuleType;
import com.scooter.modules.discount.repository.DiscountRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DiscountRuleService {

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<DiscountRuleResponse> getDiscountRules() {
        return discountRuleRepository.findAll().stream()
                .sorted(Comparator.comparing(DiscountRule::getId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DiscountRuleResponse createDiscountRule(DiscountRuleRequest request) {
        SecurityUtils.requireManagerRole();
        validateRequest(request);

        if (discountRuleRepository.existsByRuleType(request.getRuleType())) {
            throw new BusinessException("DISCOUNT_RULE_CONFLICT", "Discount rule for this type already exists");
        }

        DiscountRule rule = new DiscountRule();
        applyRequest(rule, request);
        return toResponse(discountRuleRepository.save(rule));
    }

    @Transactional
    public DiscountRuleResponse updateRuleStatus(Long ruleId, DiscountRuleStatusRequest request) {
        SecurityUtils.requireManagerRole();

        DiscountRule rule = findRuleOrThrow(ruleId);
        rule.setEnabled(request.getEnabled());
        return toResponse(discountRuleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public AppliedDiscount resolveBestDiscount(User user) {
        List<DiscountRule> activeRules = discountRuleRepository.findAll().stream()
                .filter(rule -> Boolean.TRUE.equals(rule.getEnabled()))
                .filter(rule -> isEligible(rule, user))
                .sorted(Comparator.comparing(DiscountRule::getDiscountRate).reversed()
                        .thenComparing(rule -> rule.getRuleType().name()))
                .collect(Collectors.toList());

        if (activeRules.isEmpty()) {
            return AppliedDiscount.none();
        }

        DiscountRule rule = activeRules.get(0);
        return new AppliedDiscount(rule.getRuleType().name(), rule.getDiscountRate());
    }

    public BigDecimal calculateDiscountAmount(BigDecimal originalPrice, AppliedDiscount appliedDiscount) {
        if (appliedDiscount == null || appliedDiscount.isNone()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return originalPrice
                .multiply(appliedDiscount.discountRate())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    private DiscountRule findRuleOrThrow(Long ruleId) {
        return discountRuleRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException("DISCOUNT_RULE_NOT_FOUND", "Discount rule not found"));
    }

    private void applyRequest(DiscountRule rule, DiscountRuleRequest request) {
        rule.setRuleType(request.getRuleType());
        rule.setDiscountRate(request.getDiscountRate().setScale(2, RoundingMode.HALF_UP));
        rule.setEnabled(request.getEnabled());
        rule.setMinCompletedBookings(request.getMinCompletedBookings());
    }

    private void validateRequest(DiscountRuleRequest request) {
        if (request.getRuleType() == DiscountRuleType.FREQUENT_USER && request.getMinCompletedBookings() == null) {
            throw new BusinessException("DISCOUNT_RULE_INVALID", "Frequent user rule requires minimum completed bookings");
        }
        if (request.getRuleType() != DiscountRuleType.FREQUENT_USER && request.getMinCompletedBookings() != null) {
            throw new BusinessException("DISCOUNT_RULE_INVALID",
                    "Only frequent user rules may define minimum completed bookings");
        }
    }

    private boolean isEligible(DiscountRule rule, User user) {
        return switch (rule.getRuleType()) {
            case FREQUENT_USER -> hasEnoughCompletedBookings(user.getUserId(), rule.getMinCompletedBookings());
            case STUDENT -> isStudentUser(user);
            case SENIOR -> isSeniorUser(user);
        };
    }

    private boolean hasEnoughCompletedBookings(UUID userId, Integer minimum) {
        long completedBookings = bookingRepository.countByUserIdAndStatusIn(userId,
                List.of(BookingStatus.PAID, BookingStatus.COMPLETED));
        return completedBookings >= minimum;
    }

    private boolean isStudentUser(User user) {
        return user.getEmail() != null && user.getEmail().toLowerCase().endsWith(".edu");
    }

    private boolean isSeniorUser(User user) {
        if (user.getEmail() == null) {
            return false;
        }
        String email = user.getEmail().toLowerCase();
        return email.contains("senior") || email.contains("elder");
    }

    private DiscountRuleResponse toResponse(DiscountRule rule) {
        DiscountRuleResponse response = new DiscountRuleResponse();
        response.setRuleId(rule.getId().toString());
        response.setRuleType(rule.getRuleType().name());
        response.setDiscountRate(rule.getDiscountRate());
        response.setEnabled(rule.getEnabled());
        response.setMinCompletedBookings(rule.getMinCompletedBookings());
        response.setEligibilityDescription(buildEligibilityDescription(rule));
        response.setCreatedAt(rule.getCreatedAt());
        return response;
    }

    private String buildEligibilityDescription(DiscountRule rule) {
        return switch (rule.getRuleType()) {
            case FREQUENT_USER -> "Applies when paid or completed bookings are at least "
                    + rule.getMinCompletedBookings();
            case STUDENT -> "Applies when the user email ends with .edu";
            case SENIOR -> "Applies when the user email contains senior or elder";
        };
    }

    public record AppliedDiscount(String ruleType, BigDecimal discountRate) {
        public static AppliedDiscount none() {
            return new AppliedDiscount(null, null);
        }

        public boolean isNone() {
            return ruleType == null || discountRate == null;
        }
    }
}
