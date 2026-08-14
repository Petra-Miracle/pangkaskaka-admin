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

// SECURITY_AUDIT.md S5: backend `detail`/`message` strings can contain
// internals not meant for the UI. 401/403 messages are safe/useful to show
// as-is (they're just "you're not allowed"); everything else is logged for
// debugging and swapped for a generic message.
export function getSafeErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return err.message;
    console.error(`[API ${err.status}]`, err.message, err.body);
    return fallback;
  }
  if (err instanceof Error) console.error("[API error]", err.message);
  return fallback;
}
