import { clearSession, getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL && typeof window !== "undefined") {
  console.error("NEXT_PUBLIC_API_BASE_URL is not set");
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }
    throw new ApiError(401, "Unauthorized");
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (data as { detail?: string; message?: string } | null)?.detail
      ?? (data as { detail?: string; message?: string } | null)?.message
      ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

// SECURITY_AUDIT.md S5 (revised 2026-08-21): backend `detail`/`message`
// strings can contain internals not meant for the UI, but only on the
// server's own mistakes (5xx) — every 4xx in this backend is a deliberate
// `raise HTTPException(4xx, "...")` with a hand-written, caller-facing
// Indonesian message (confirmed: no `str(e)`/exception passthroughs in any
// of the 60+ 400s in server.py), so hiding those behind a generic fallback
// was actively throwing away the one piece of information the admin needed
// (e.g. "Pemilik ini masih punya toko terdaftar..." on a blocked delete).
// 5xx and network failures still log and fall back to generic wording.
export function getSafeErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status >= 400 && err.status < 500) return err.message;
    console.error(`[API ${err.status}]`, err.message, err.body);
    return fallback;
  }
  if (err instanceof Error) console.error("[API error]", err.message);
  return fallback;
}
