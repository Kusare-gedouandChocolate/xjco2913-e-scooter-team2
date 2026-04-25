package com.scooter.modules.damage.repository;

import com.scooter.modules.damage.entity.DamageEvent;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DamageEventRepository extends JpaRepository<DamageEvent, Long> {
    Optional<DamageEvent> findByBookingId(Long bookingId);

    List<DamageEvent> findAll(Sort sort);
}
