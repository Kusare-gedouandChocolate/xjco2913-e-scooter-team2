package com.scooter.modules.damage.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.damage.dto.DamageEventResponse;
import com.scooter.modules.damage.entity.DamageEvent;
import com.scooter.modules.damage.repository.DamageEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DamageEventService {

    @Autowired
    private DamageEventRepository damageEventRepository;

    @Transactional(readOnly = true)
    public List<DamageEventResponse> getDamageEvents() {
        SecurityUtils.requireManagerRole();
        return damageEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DamageEventResponse getDamageEventByBookingId(Long bookingId) {
        SecurityUtils.requireManagerRole();
        DamageEvent damageEvent = damageEventRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BusinessException("DAMAGE_EVENT_NOT_FOUND", "Damage event not found"));
        return toResponse(damageEvent);
    }

    private DamageEventResponse toResponse(DamageEvent damageEvent) {
        return DamageEventResponse.builder()
                .damageEventId(damageEvent.getId() != null ? damageEvent.getId().toString() : null)
                .bookingId(damageEvent.getBookingId() != null ? damageEvent.getBookingId().toString() : null)
                .scooterId(damageEvent.getScooterId() != null ? damageEvent.getScooterId().toString() : null)
                .reportedByUserId(damageEvent.getReportedByUserId())
                .damageLevel(damageEvent.getDamageLevel() != null ? damageEvent.getDamageLevel().name() : null)
                .description(damageEvent.getDescription())
                .imageUrl(damageEvent.getImageUrl())
                .damageFee(damageEvent.getDamageFee() != null ? damageEvent.getDamageFee().toString() : null)
                .createdAt(damageEvent.getCreatedAt() != null ? damageEvent.getCreatedAt().toString() : null)
                .build();
    }
}
