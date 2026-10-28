"use client";

export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SEO_MANAGER"
  | "BRANCH_MANAGER"
  | "BRANCH_STAFF"
  | "CUSTOMER";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  isEmailVerified?: boolean;
}

const TOKEN_KEY = "solusation_admin_token";
const USER_KEY = "solusation_admin_user";

export const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || null;
};

export const getAdminUser = (): AdminUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
};

export const setAdminSession = (token: string, user: AdminUser): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `solusation_admin_role=${encodeURIComponent(user.role)}; path=/; max-age=604800; SameSite=Lax`;
};

export const clearAdminSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `solusation_admin_role=; path=/; max-age=0`;
};

export const isAuthenticated = (): boolean => {
  return !!getAdminToken();
};

export const isSuperAdmin = (user?: AdminUser | null): boolean => {
  const current = user ?? getAdminUser();
  return current?.role === "SUPER_ADMIN" || current?.role === "ADMIN";
};

export const isSeoManager = (user?: AdminUser | null): boolean => {
  const current = user ?? getAdminUser();
  return current?.role === "SEO_MANAGER";
};

/**
 * Validates whether the role can access a particular path
 */
export const canAccessPath = (pathname: string, user?: AdminUser | null): boolean => {
  const current = user ?? getAdminUser();
  if (!current) return false;

  // Super Admin & Admin can access every route
  if (current.role === "SUPER_ADMIN" || current.role === "ADMIN") {
    return true;
  }

  // SEO Manager Sub-Admin is strictly limited to SEO, Blogs, Traffic, Banners & Dashboard
  if (current.role === "SEO_MANAGER") {
    const allowedPatterns = [
      /^\/$/,
      /^\/blogs(\/.*)?$/,
      /^\/seo(\/.*)?$/,
      /^\/traffic(\/.*)?$/,
      /^\/banners(\/.*)?$/,
    ];
    return allowedPatterns.some((pattern) => pattern.test(pathname));
  }

  return false;
};
