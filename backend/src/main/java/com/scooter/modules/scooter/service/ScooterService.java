package com.scooter.modules.scooter.service;

import com.scooter.modules.scooter.dto.PricingRuleResponse;
import com.scooter.modules.scooter.dto.ScooterResponse;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScooterService {

    @Autowired
    private ScooterRepository scooterRepository;

    @Autowired
    private RentalOptionRepository rentalOptionRepository;

    public List<ScooterResponse> findAllScooters() {
        return scooterRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<ScooterResponse> findScootersByStatus(ScooterStatus status) {
        return scooterRepository.findByStatus(status, null).getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public ScooterResponse getById(Long scooterId) {
        Scooter scooter = scooterRepository.findById(scooterId)
                .orElseThrow(() -> new RuntimeException("Scooter not found"));
        return convertToResponse(scooter);
    }

    public List<PricingRuleResponse> getPricingRules() {
        return rentalOptionRepository.findAll().stream()
                .map(this::convertToPricingRule)
                .collect(Collectors.toList());
    }

    private ScooterResponse convertToResponse(Scooter scooter) {
        ScooterResponse resp = new ScooterResponse();
        resp.setScooterId(scooter.getId().toString());
        resp.setCode(scooter.getModel());
        resp.setStatus(scooter.getStatus().name().toLowerCase());
        resp.setLocation("default location");
        resp.setBasePrice(500);
        return resp;
    }

    private PricingRuleResponse convertToPricingRule(RentalOption option) {
        PricingRuleResponse resp = new PricingRuleResponse();
        resp.setRuleId(option.getId().toString());
        resp.setHireType(option.getDurationLabel());
        resp.setPrice(option.getPrice().intValue());
        resp.setDiscountEnabled(false);
        return resp;
    }
}