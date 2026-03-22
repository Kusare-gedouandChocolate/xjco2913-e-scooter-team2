package com.scooter.common.response;

import lombok.Data;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
public class Result<T> {
    private boolean success;
    private String code;
    private String message;
    private T data;
    private String requestId;
    private String timestamp;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setCode("OK");
        result.setMessage("Request succeeded");
        result.setData(data);
        result.setRequestId(UUID.randomUUID().toString());
        result.setTimestamp(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return result;
    }

    public static <T> Result<T> error(String code, String message) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setCode(code);
        result.setMessage(message);
        result.setRequestId(UUID.randomUUID().toString());
        result.setTimestamp(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return result;
    }
}
