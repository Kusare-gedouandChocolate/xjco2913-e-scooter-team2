package com.scooter.modules.scooter.repository;

import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository for Scooter entity.
 * Supports pagination and filtering by status.
 */
public interface ScooterRepository extends JpaRepository<Scooter, Long> {
    // Standard query method to find scooters by their current status
    Page<Scooter> findByStatus(ScooterStatus status, Pageable pageable);

    boolean existsByModelIgnoreCase(String model);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Scooter s where s.id = :scooterId")
    Optional<Scooter> findByIdForUpdate(@Param("scooterId") Long scooterId);
}
