package com.scooter.modules.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a user in the system.
 * Maps to the 'users' table in the database.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID userId;

    @Column(unique = true, nullable = false)
    private String email;

    /**
     * Encrypted password.
     * Never store plain-text passwords for security compliance.
     */
    @Column(nullable = false)
    private String passwordHash;

    /**
     * User role to distinguish between 'customer' and 'manager'.
     */
    @Column(nullable = false)
    private String role;

    @Column(name = "full_name")
    private String fullName;

    private String phone;

    @Column(name = "card_token")
    private String cardToken;

    @Column(name = "walk_in_customer", nullable = false)
    @Builder.Default
    private Boolean walkInCustomer = Boolean.FALSE;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
