package com.scooter.modules.booking.repository;

import com.scooter.modules.booking.entity.Booking;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Booking entity.
 * Handles database operations for user reservations.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Basic CRUD operations like save() and findById() are already provided.
    List<Booking> findByUserId(Long userId, Sort sort);
}