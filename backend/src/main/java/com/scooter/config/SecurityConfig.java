package com.scooter.config;

import com.scooter.common.security.JwtAuthenticationFilter;
import com.scooter.common.response.Result;
import com.scooter.common.web.RequestContext;
import com.scooter.common.web.RequestIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RequestIdFilter requestIdFilter;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Define the password encoder for the application (BCrypt)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Expose AuthenticationManager bean for authentication purposes
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Main security filter chain configuration
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS with the configuration defined below
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable CSRF as we use JWT tokens (stateless)
                .csrf(csrf -> csrf.disable())

                // Set session management to stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()))

                // Define authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints: login, register, and scooter browsing
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/scooters", "/api/v1/scooters/**").permitAll()
                        .requestMatchers("/api/v1/pricing-rules", "/api/v1/pricing-rules/**").permitAll()
                        .requestMatchers("/api/v1/discount-rules", "/api/v1/discount-rules/**").permitAll()
                        // All other requests must be authenticated
                        .anyRequest().authenticated())

                // Disable anonymous authentication to avoid anonymousUser hitting controllers
                .anonymous(anonymous -> anonymous.disable())

                // Add JWT filter before the standard UsernamePassword filter
                .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setHeader(RequestContext.REQUEST_ID_HEADER, RequestContext.getOrCreateRequestId());
            objectMapper.writeValue(response.getWriter(),
                    Result.error("AUTH_REQUIRED", "User not authenticated"));
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setHeader(RequestContext.REQUEST_ID_HEADER, RequestContext.getOrCreateRequestId());
            objectMapper.writeValue(response.getWriter(),
                    Result.error("ACCESS_FORBIDDEN", "Access is forbidden for the current role"));
        };
    }

    /**
     * CORS configuration to allow requests from the React frontend (port 5173)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed origins (your frontend development server)
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));

        // Allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allowed headers including Authorization for JWT
        configuration.setAllowedHeaders(
                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "x-request-id"));

        // Allow sending credentials like cookies or authorization headers
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all endpoints
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
