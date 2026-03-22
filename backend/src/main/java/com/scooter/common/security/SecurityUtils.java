package com.scooter.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return Long.parseLong(((UserDetails) principal).getUsername());
        }

        if (principal instanceof String) {
            return Long.parseLong((String) principal);
        }
        throw new RuntimeException("Unable to extract user ID from authentication");
    }
}