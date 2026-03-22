package com.scooter.common.exception;

import lombok.Getter;

/**
 * Custom exception for business-level errors.
 * Allows passing specific error codes defined in the API specifications.
 */
@Getter
public class BusinessException extends RuntimeException {
    private final String code;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }
}
