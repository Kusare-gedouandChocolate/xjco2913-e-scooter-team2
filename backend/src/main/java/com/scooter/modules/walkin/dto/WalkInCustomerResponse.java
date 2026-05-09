package com.scooter.modules.walkin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WalkInCustomerResponse {
    private UUID userId;
    private String fullName;
    private String phone;
    private String role;
    private Boolean walkInCustomer;
}
