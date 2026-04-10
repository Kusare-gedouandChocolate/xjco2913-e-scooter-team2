package com.scooter.common.security;

import com.scooter.common.exception.BusinessException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class SecurityUtils {

    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException("AUTH_REQUIRED", "User not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }

        if (principal instanceof String) {
            return (String) principal;
        }

        throw new BusinessException("AUTH_INVALID", "Unable to extract user ID from authentication principal");
    }

    public static void requireManagerRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new BusinessException("AUTH_REQUIRED", "User not authenticated");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        boolean isManager = authorities != null
                && authorities.stream().map(GrantedAuthority::getAuthority).anyMatch("manager"::equalsIgnoreCase);

        if (!isManager) {
            throw new BusinessException("ACCESS_FORBIDDEN", "Manager role is required");
        }
    }
}
