package com.scooter.common.security;

import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user;

        try {
            UUID userId = UUID.fromString(identifier);
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));
        } catch (IllegalArgumentException e) {
            user = userRepository.findByEmail(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + identifier));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUserId().toString(),
                user.getPasswordHash(),
                Collections.singletonList(new SimpleGrantedAuthority(normalizeRole(user.getRole()))));
    }

    private String normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "customer";
        }

        String normalizedRole = rawRole.trim().toLowerCase();
        if ("admin".equals(normalizedRole) || "manager".equals(normalizedRole)) {
            return "manager";
        }

        return "customer";
    }
}
