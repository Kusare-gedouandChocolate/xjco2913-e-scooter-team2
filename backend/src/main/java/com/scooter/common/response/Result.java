package com.scooter.common.response;

import com.scooter.common.web.RequestContext;
import lombok.Data;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
public class Result<T> {
    private boolean success;
    private String code;
    private String message;
    private T data;
    private String requestId;
    private String timestamp;
    private List<ErrorItem> errors;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setCode("OK");
        result.setMessage("Request succeeded");
        result.setData(data);
        result.setRequestId(RequestContext.getOrCreateRequestId());
        result.setTimestamp(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return result;
    }

    public static <T> Result<T> error(String code, String message) {
        return error(code, message, null);
    }

    public static <T> Result<T> error(String code, String message, List<ErrorItem> errors) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setCode(code);
        result.setMessage(message);
        result.setErrors(errors);
        result.setRequestId(RequestContext.getOrCreateRequestId());
        result.setTimestamp(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return result;
    }

    @Data
    public static class ErrorItem {
        private final String field;
        private final String reason;
    }
}
