package com.scooter.modules.scooter.service;

import com.scooter.modules.scooter.dto.ScooterResponse;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.entity.Scooter;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.repository.RentalOptionRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScooterService {

    @Autowired
    private ScooterRepository scooterRepository;

    @Autowired
    private RentalOptionRepository rentalOptionRepository;

    /**
     * Get available scooters with pagination.
     */
    public Page<ScooterResponse> getAvailableScooters(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Scooter> scooterPage = scooterRepository.findByStatus(ScooterStatus.AVAILABLE, pageRequest);

        // Convert Entity to DTO (ScooterResponse)
        return scooterPage.map(this::convertToResponse);
    }

    /**
     * Get all pre-defined pricing options.
     */
    public List<RentalOption> getPricingOptions() {
        return rentalOptionRepository.findAll();
    }

    private ScooterResponse convertToResponse(Scooter scooter) {
        ScooterResponse response = new ScooterResponse();
        response.setId(scooter.getId());
        response.setModelName(scooter.getModelName());
        response.setBatteryLevel(scooter.getBatteryLevel());
        response.setLocation(scooter.getLocation());
        response.setStatus(scooter.getStatus().name());
        return response;
    }
}