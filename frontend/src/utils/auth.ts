import type { User } from '../types';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

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

export const isManager = (): boolean => getAuthUser()?.role === 'manager';

export const saveSession = (token: string, user: User): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};
