package com.scooter.modules.scooter.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Scooter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String model;

    @Enumerated(EnumType.STRING)
    private ScooterStatus status;

    private Integer batteryLevel;
}