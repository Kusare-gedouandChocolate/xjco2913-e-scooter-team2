package com.scooter.modules.discount.repository;

import com.scooter.modules.discount.entity.DiscountRule;
import com.scooter.modules.discount.entity.DiscountRuleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    boolean existsByRuleType(DiscountRuleType ruleType);

    Optional<DiscountRule> findByRuleType(DiscountRuleType ruleType);
}
