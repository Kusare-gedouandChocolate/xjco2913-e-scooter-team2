package com.scooter.common.security;

public final class RoleUtils {

    private RoleUtils() {
    }

    public static String normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) return "customer";
        String normalized = rawRole.trim().toLowerCase();
        if ("administrator".equals(normalized)) return "admin";
        if ("admin".equals(normalized)) return "admin";
        if ("manager".equals(normalized)) return "manager";
        if ("staff".equals(normalized) || "clerk".equals(normalized)) return "clerk";
        return "customer";
    }

    public static boolean isManagerOrAdmin(String role) {
        String normalizedRole = normalizeRole(role);
        return "manager".equals(normalizedRole) || "admin".equals(normalizedRole);
    }

    public static boolean isStaffOrAdmin(String role) {
        String normalizedRole = normalizeRole(role);
        return "staff".equals(normalizedRole)
                || "manager".equals(normalizedRole)
                || "admin".equals(normalizedRole);
    }
}
