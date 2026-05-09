package com.scooter.modules.scooter.repository;

import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for Scooter entity.
 * Supports pagination and filtering by status.
 */
public interface ScooterRepository extends JpaRepository<Scooter, Long> {
    // Standard query method to find scooters by their current status
    Page<Scooter> findByStatus(ScooterStatus status, Pageable pageable);

    boolean existsByModelIgnoreCase(String model);
}
