export const AUTH_COOKIE = "pk_admin_token";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
};

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pk_admin_token");
}

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("pk_admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AdminUser) {
  window.localStorage.setItem("pk_admin_token", token);
  window.localStorage.setItem("pk_admin_user", JSON.stringify(user));
  // Mirrored into a cookie (non-httpOnly, this is a client-side SPA hitting a
  // separate API origin) so proxy.ts can do an optimistic route guard check.
  setCookie(AUTH_COOKIE, token, 7);
}

export function clearSession() {
  window.localStorage.removeItem("pk_admin_token");
  window.localStorage.removeItem("pk_admin_user");
  deleteCookie(AUTH_COOKIE);
}
