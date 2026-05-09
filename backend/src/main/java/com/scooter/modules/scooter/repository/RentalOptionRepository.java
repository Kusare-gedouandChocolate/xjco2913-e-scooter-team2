package com.scooter.modules.scooter.repository;

import com.scooter.modules.scooter.entity.RentalOption;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for rental pricing options.
 */
public interface RentalOptionRepository extends JpaRepository<RentalOption, Long> {
    // Basic CRUD operations are inherited from JpaRepository
}