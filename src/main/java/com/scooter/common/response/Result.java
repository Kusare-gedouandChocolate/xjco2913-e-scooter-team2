package com.scooter.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Global unified response structure.
 * Matches the "Front-end and Back-end API Naming and Usage Specifications".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private boolean success;
    private String code;
    private String message;
    private T data;
    private String requestId;
    private String timestamp;

    /**
     * Factory method for successful responses.
     */
    public static <T> Result<T> success(T data) {
        return Result.<T>builder()
                .success(true)
                .code("OK")
                .message("Request succeeded")
                .data(data)
                .requestId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now().toString())
                .build();
    }

    /**
     * Factory method for error responses.
     */
    public static <T> Result<T> error(String code, String message) {
        return Result.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .requestId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now().toString())
                .build();
    }
}