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

const USER_KEY = "solusation_admin_user";

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

/**
 * Keeps only the profile used to draw the UI. The tokens stay in HttpOnly cookies,
 * and the API checks the real role on every request, so editing this cannot grant access.
 */
export const setAdminSession = (user: AdminUser): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAdminSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  // Clears what older versions of this panel stored.
  localStorage.removeItem("solusation_admin_token");
  document.cookie = "solusation_admin_token=; path=/; max-age=0";
  document.cookie = "solusation_admin_role=; path=/; max-age=0";
};

export const isAuthenticated = (): boolean => {
  return !!getAdminUser();
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
