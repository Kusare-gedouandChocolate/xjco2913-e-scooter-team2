package com.scooter.common.security;

public final class RoleUtils {

    private RoleUtils() {
    }

    public static String normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "customer";
        }

        String normalizedRole = rawRole.trim().toLowerCase();
        if ("administrator".equals(normalizedRole)) {
            return "admin";
        }
        if ("admin".equals(normalizedRole)) {
            return "admin";
        }
        if ("manager".equals(normalizedRole)) {
            return "manager";
        }
        if ("staff".equals(normalizedRole) || "clerk".equals(normalizedRole)) {
            return "staff";
        }

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
