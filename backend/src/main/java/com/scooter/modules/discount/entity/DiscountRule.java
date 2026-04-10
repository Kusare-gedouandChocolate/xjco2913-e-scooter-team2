package com.scooter.modules.discount.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class DiscountRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private DiscountRuleType ruleType;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountRate;

    @Column(nullable = false)
    private Boolean enabled;

    private Integer minCompletedBookings;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (enabled == null) {
            enabled = Boolean.TRUE;
        }
    }
}
