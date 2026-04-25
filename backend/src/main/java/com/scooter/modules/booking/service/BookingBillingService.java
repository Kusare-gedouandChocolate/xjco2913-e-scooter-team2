package com.scooter.modules.booking.service;

import com.scooter.modules.booking.entity.Booking;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class BookingBillingService {

    private static final BigDecimal ZERO_AMOUNT = new BigDecimal("0.00");
    private static final BigDecimal BATTERY_USAGE_FEE_PER_PERCENT = new BigDecimal("20.00");

    public ChargeBreakdown calculateBreakdown(Booking booking) {
        return calculateBreakdown(booking, booking.getCompletedAt());
    }

    public ChargeBreakdown calculateBreakdown(Booking booking, LocalDateTime effectiveEndTime) {
        BigDecimal baseRentalFee = resolveBaseRentalFee(booking);
        long overtimeMinutes = calculateOvertimeMinutes(booking, effectiveEndTime);
        BigDecimal overtimeFee = calculateOvertimeFee(baseRentalFee, booking, overtimeMinutes);
        int batteryUsagePercent = calculateBatteryUsagePercent(booking);
        BigDecimal batteryUsageFee = BATTERY_USAGE_FEE_PER_PERCENT
                .multiply(BigDecimal.valueOf(batteryUsagePercent))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal damageFee = booking.getDamageFee() != null
                ? booking.getDamageFee().setScale(2, RoundingMode.HALF_UP)
                : ZERO_AMOUNT;
        BigDecimal totalFee = baseRentalFee.add(overtimeFee).add(batteryUsageFee).add(damageFee)
                .setScale(2, RoundingMode.HALF_UP);

        return new ChargeBreakdown(
                baseRentalFee,
                overtimeFee,
                batteryUsageFee,
                damageFee,
                totalFee,
                overtimeMinutes,
                batteryUsagePercent);
    }

    private BigDecimal resolveBaseRentalFee(Booking booking) {
        BigDecimal originalPrice = booking.getOriginalPrice();
        BigDecimal discountAmount = booking.getDiscountAmount();

        if (originalPrice == null && booking.getTotalPrice() != null) {
            return booking.getTotalPrice().setScale(2, RoundingMode.HALF_UP);
        }
        if (originalPrice == null) {
            return ZERO_AMOUNT;
        }

        BigDecimal resolvedDiscount = discountAmount == null ? ZERO_AMOUNT : discountAmount;
        BigDecimal baseRentalFee = originalPrice.subtract(resolvedDiscount);
        if (baseRentalFee.signum() < 0) {
            return ZERO_AMOUNT;
        }
        return baseRentalFee.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateOvertimeFeeAt(Booking booking, LocalDateTime effectiveEndTime) {
        BigDecimal baseRentalFee = resolveBaseRentalFee(booking);
        long overtimeMinutes = calculateOvertimeMinutes(booking, effectiveEndTime);
        return calculateOvertimeFee(baseRentalFee, booking, overtimeMinutes);
    }

    private long calculateOvertimeMinutes(Booking booking, LocalDateTime effectiveEndTime) {
        LocalDateTime actualStartTime = booking.getPickedUpAt() != null
                ? booking.getPickedUpAt()
                : booking.getStartTime() != null ? booking.getStartTime() : booking.getCreatedAt();
        LocalDateTime completedAt = effectiveEndTime;

        if (actualStartTime == null || completedAt == null || completedAt.isBefore(actualStartTime)) {
            return 0L;
        }

        Integer durationHours = booking.getRentalOption() != null ? booking.getRentalOption().getDurationHours() : null;
        if (durationHours == null || durationHours <= 0) {
            return 0L;
        }

        long actualMinutes = Duration.between(actualStartTime, completedAt).toMinutes();
        long includedMinutes = durationHours.longValue() * 60L;
        return Math.max(actualMinutes - includedMinutes, 0L);
    }

    private BigDecimal calculateOvertimeFee(BigDecimal baseRentalFee, Booking booking, long overtimeMinutes) {
        if (overtimeMinutes <= 0) {
            return ZERO_AMOUNT;
        }

        Integer durationHours = booking.getRentalOption() != null ? booking.getRentalOption().getDurationHours() : null;
        if (durationHours == null || durationHours <= 0) {
            return ZERO_AMOUNT;
        }

        long includedMinutes = durationHours.longValue() * 60L;
        if (includedMinutes <= 0 || baseRentalFee.signum() <= 0) {
            return ZERO_AMOUNT;
        }

        return baseRentalFee
                .divide(BigDecimal.valueOf(includedMinutes), 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(overtimeMinutes))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateBatteryUsagePercent(Booking booking) {
        Integer pickupBatteryLevel = booking.getPickupBatteryLevel();
        Integer returnBatteryLevel = booking.getReturnBatteryLevel();
        if (pickupBatteryLevel == null || returnBatteryLevel == null) {
            return 0;
        }
        return Math.max(pickupBatteryLevel - returnBatteryLevel, 0);
    }

    public record ChargeBreakdown(
            BigDecimal baseRentalFee,
            BigDecimal overtimeFee,
            BigDecimal batteryUsageFee,
            BigDecimal damageFee,
            BigDecimal totalFee,
            long overtimeMinutes,
            int batteryUsagePercent) {
    }
}
