package com.scooter.modules.damage.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "damage_event")
@Data
public class DamageEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;

    @Column(name = "scooter_id", nullable = false)
    private Long scooterId;

    @Column(name = "reported_by_user_id")
    private String reportedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "damage_level")
    private DamageLevel damageLevel;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "damage_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal damageFee;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
