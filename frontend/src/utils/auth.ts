import type { User } from '../types';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

export const hasManagerRole = (role?: string | null): boolean => {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'manager' || normalizedRole === 'admin';
};

export const hasClerkRole = (role?: string | null): boolean => {
  if (!role) return false;
  return role.trim().toLowerCase() === 'clerk';
};

export const getAuthUser = (): User | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const isAuthenticated = (): boolean => !!getAuthToken();

export const isManager = (): boolean => hasManagerRole(getAuthUser()?.role);

export const isClerk = (): boolean => hasClerkRole(getAuthUser()?.role);

export const saveSession = (token: string, user: User): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};
