package com.scooter.modules.payment.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.modules.auth.entity.User;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class CardTokenService {

    private static final Pattern CARD_TOKEN_PATTERN =
            Pattern.compile("^tok_[A-Za-z0-9]{12,64}$");

    public void validateCardTokenOrThrow(String cardToken) {
        if (cardToken == null || cardToken.isBlank()) {
            throw new BusinessException("CARD_TOKEN_REQUIRED", "Card token is required");
        }

        if (!CARD_TOKEN_PATTERN.matcher(cardToken.trim()).matches()) {
            throw new BusinessException(
                    "CARD_TOKEN_INVALID",
                    "Card token is invalid. Expected format: tok_ followed by 12 to 64 letters or digits");
        }
    }

    public String resolveBoundCardToken(User user, String requestCardToken) {
        Objects.requireNonNull(user, "User must not be null");

        if (requestCardToken != null && !requestCardToken.isBlank()) {
            validateCardTokenOrThrow(requestCardToken);
            if (user.getCardToken() == null || !requestCardToken.trim().equals(user.getCardToken())) {
                throw new BusinessException(
                        "CARD_TOKEN_MISMATCH",
                        "Provided card token does not match the card token bound to this customer");
            }
            return requestCardToken.trim();
        }

        String boundCardToken = user.getCardToken();
        validateCardTokenOrThrow(boundCardToken);
        return boundCardToken.trim();
    }
}
