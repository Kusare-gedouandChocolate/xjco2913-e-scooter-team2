package com.scooter.modules.scooter.entity;

/**
 * Current status of a scooter in the system.
 */
public enum ScooterStatus {
    AVAILABLE, // Ready for rental
    IN_USE, // Currently active trip
    MAINTENANCE, // Under repair
    LOCKED // Disabled for safety
}