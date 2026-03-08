package com.scooter.modules.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
}