package com.scooter.modules.scooter.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.scooter.dto.AdminScooterRequest;
import com.scooter.modules.scooter.dto.AdminScooterResponse;
import com.scooter.modules.scooter.dto.PricingRuleResponse;
import com.scooter.modules.scooter.dto.PricingRuleUpdateRequest;
import com.scooter.modules.scooter.dto.ScooterResponse;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScooterService {

    @Autowired
    private ScooterRepository scooterRepository;

    @Autowired
    private RentalOptionRepository rentalOptionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<ScooterResponse> findAllScooters() {
        return scooterRepository.findAll().stream()
                .map(this::convertToPublicResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ScooterResponse> findScootersByStatus(ScooterStatus status) {
        return scooterRepository.findByStatus(status, PageRequest.of(0, 1000)).getContent().stream()
                .map(this::convertToPublicResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScooterResponse getById(Long scooterId) {
        return convertToPublicResponse(findScooterOrThrow(scooterId));
    }

    @Transactional(readOnly = true)
    public List<PricingRuleResponse> getPricingRules() {
        return rentalOptionRepository.findAll().stream()
                .map(this::convertToPricingRule)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PricingRuleResponse getPricingRuleById(Long ruleId) {
        return convertToPricingRule(findPricingRuleOrThrow(ruleId));
    }

    @Transactional
    public PricingRuleResponse updatePricingRule(Long ruleId, PricingRuleUpdateRequest request) {
        SecurityUtils.requireManagerRole();

        RentalOption option = findPricingRuleOrThrow(ruleId);
        option.setDurationLabel(request.getHireType().trim());
        option.setDurationHours(request.getDurationHours());
        option.setPrice(request.getPrice());
        return convertToPricingRule(rentalOptionRepository.save(option));
    }

    @Transactional
    public AdminScooterResponse createScooter(AdminScooterRequest request) {
        SecurityUtils.requireManagerRole();

        String normalizedModel = normalizeModel(request.getModel());
        if (scooterRepository.existsByModelIgnoreCase(normalizedModel)) {
            throw new BusinessException("SCOOTER_CONFLICT", "Scooter model already exists");
        }

        Scooter scooter = new Scooter();
        applyAdminRequest(scooter, request, normalizedModel);
        return convertToAdminResponse(scooterRepository.save(scooter));
    }

    @Transactional(readOnly = true)
    public List<AdminScooterResponse> getAllScootersForAdmin() {
        SecurityUtils.requireManagerRole();
        return scooterRepository.findAll().stream()
                .sorted(Comparator.comparing(Scooter::getId))
                .map(this::convertToAdminResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminScooterResponse getScooterDetailsForAdmin(Long scooterId) {
        SecurityUtils.requireManagerRole();
        return convertToAdminResponse(findScooterOrThrow(scooterId));
    }

    @Transactional
    public AdminScooterResponse updateScooter(Long scooterId, AdminScooterRequest request) {
        SecurityUtils.requireManagerRole();

        Scooter scooter = findScooterOrThrow(scooterId);
        String normalizedModel = normalizeModel(request.getModel());
        if (!scooter.getModel().equalsIgnoreCase(normalizedModel) && scooterRepository.existsByModelIgnoreCase(normalizedModel)) {
            throw new BusinessException("SCOOTER_CONFLICT", "Scooter model already exists");
        }

        applyAdminRequest(scooter, request, normalizedModel);
        return convertToAdminResponse(scooterRepository.save(scooter));
    }

    @Transactional
    public void deleteScooter(Long scooterId) {
        SecurityUtils.requireManagerRole();

        Scooter scooter = findScooterOrThrow(scooterId);
        if (scooter.getStatus() == ScooterStatus.IN_USE || scooter.getStatus() == ScooterStatus.LOCKED) {
            throw new BusinessException("SCOOTER_CONFLICT", "Scooter cannot be deleted in current status");
        }
        if (bookingRepository.existsByScooter_Id(scooterId)) {
            throw new BusinessException("SCOOTER_DELETE_CONFLICT", "Scooter with booking history cannot be deleted");
        }

        scooterRepository.delete(scooter);
    }

    private Scooter findScooterOrThrow(Long scooterId) {
        return scooterRepository.findById(scooterId)
                .orElseThrow(() -> new BusinessException("SCOOTER_NOT_FOUND", "Scooter not found"));
    }

    private RentalOption findPricingRuleOrThrow(Long ruleId) {
        return rentalOptionRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException("PRICING_RULE_NOT_FOUND", "Pricing rule not found"));
    }

    private void applyAdminRequest(Scooter scooter, AdminScooterRequest request, String normalizedModel) {
        scooter.setModel(normalizedModel);
        scooter.setStatus(request.getStatus());
        scooter.setBatteryLevel(request.getBatteryLevel());
        scooter.setCurrentLocation(request.getCurrentLocation().trim());
    }

    private String normalizeModel(String model) {
        return model == null ? null : model.trim();
    }

    private ScooterResponse convertToPublicResponse(Scooter scooter) {
        ScooterResponse resp = new ScooterResponse();
        resp.setScooterId(scooter.getId().toString());
        resp.setCode(scooter.getModel());
        resp.setStatus(scooter.getStatus().name().toLowerCase());
        resp.setLocation(scooter.getCurrentLocation());
        resp.setBasePrice(getStartingPrice());
        return resp;
    }

    private AdminScooterResponse convertToAdminResponse(Scooter scooter) {
        AdminScooterResponse response = new AdminScooterResponse();
        response.setScooterId(scooter.getId().toString());
        response.setModel(scooter.getModel());
        response.setStatus(scooter.getStatus().name());
        response.setBatteryLevel(scooter.getBatteryLevel());
        response.setCurrentLocation(scooter.getCurrentLocation());
        response.setCreatedAt(scooter.getCreatedAt());
        return response;
    }

    private PricingRuleResponse convertToPricingRule(RentalOption option) {
        PricingRuleResponse resp = new PricingRuleResponse();
        resp.setRuleId(option.getId().toString());
        resp.setHireType(option.getDurationLabel());
        resp.setPrice(option.getPrice().intValue());
        resp.setDiscountEnabled(false);
        return resp;
    }

    private Integer getStartingPrice() {
        return rentalOptionRepository.findAll().stream()
                .map(RentalOption::getPrice)
                .min(Comparator.naturalOrder())
                .map(price -> price.intValue())
                .orElse(0);
    }
}
