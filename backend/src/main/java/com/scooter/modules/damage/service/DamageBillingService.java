package com.scooter.modules.damage.service;

import com.scooter.modules.damage.entity.DamageLevel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class DamageBillingService {

    private static final BigDecimal FIXED_DAMAGE_FEE = new BigDecimal("300.00");
    private static final BigDecimal LOW_DAMAGE_FEE = new BigDecimal("200.00");
    private static final BigDecimal MEDIUM_DAMAGE_FEE = new BigDecimal("500.00");
    private static final BigDecimal HIGH_DAMAGE_FEE = new BigDecimal("1000.00");

    public BigDecimal calculateDamageFee(Boolean damaged, DamageLevel damageLevel) {
        if (!Boolean.TRUE.equals(damaged)) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (damageLevel == null) {
            return FIXED_DAMAGE_FEE.setScale(2, RoundingMode.HALF_UP);
        }

        return switch (damageLevel) {
            case LOW -> LOW_DAMAGE_FEE.setScale(2, RoundingMode.HALF_UP);
            case MEDIUM -> MEDIUM_DAMAGE_FEE.setScale(2, RoundingMode.HALF_UP);
            case HIGH -> HIGH_DAMAGE_FEE.setScale(2, RoundingMode.HALF_UP);
        };
    }
}
