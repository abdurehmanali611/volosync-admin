import {
  getApexToken,
  persistApexSession,
  scheduleApexSessionExpiredRedirect,
  type ApexMember,
} from "./session";

/** Backend base URL — comes from `.env.local` (`NEXT_PUBLIC_API_URL`). */
export const ADMIN_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_ADMIN_API_URL ??
  "https://volosync-flsh.vercel.app"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { errors?: unknown; detail?: unknown };
  const envelope = b.errors;
  if (typeof envelope === "string" && envelope.trim()) return envelope.trim();
  if (envelope && typeof envelope === "object") {
    const obj = envelope as { message?: unknown };
    const msg = obj.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(envelope)) {
      const first = (envelope[0] as { message?: unknown } | undefined)?.message;
      if (typeof first === "string" && first.trim()) return first.trim();
    }
  }
  if (typeof b.detail === "string" && b.detail.trim()) return b.detail.trim();
  return null;
}

/**
 * Typed REST request for the Apex console.
 * Success envelopes (`{"data": ...}`) are unwrapped; failures (`{"errors": ...}`)
 * throw `ApiError`; 401 clears the session and redirects to the login page.
 */
export async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getApexToken();
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401) {
    scheduleApexSessionExpiredRedirect();
    throw new ApiError("Session expired — sign in again.", 401);
  }

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      extractMessage(body) ?? `Request failed (HTTP ${response.status}).`,
      response.status,
    );
  }

  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function mapApiError(error: unknown, fallback = "Request failed"): string {
  if (error instanceof ApiError && error.status === 401) return "";
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Short-lived read cache with in-flight dedupe (browser only)          */
/* Mirrors hotcol's graphqlListCache so list pages can share one fetch. */
/* ------------------------------------------------------------------ */

type CacheEntry = { data: unknown; expiresAt: number };

const readCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function cacheTtlMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = process.env.NEXT_PUBLIC_APEX_LIST_CACHE_MS;
  const n = raw ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  return 45_000;
}

const READ_CACHE_TTL_MS = cacheTtlMs();

export function readListCache<T>(key: string): T | null {
  if (READ_CACHE_TTL_MS <= 0) return null;
  const entry = readCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    readCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function writeListCache<T>(key: string, data: T): void {
  if (READ_CACHE_TTL_MS <= 0) return;
  readCache.set(key, { data, expiresAt: Date.now() + READ_CACHE_TTL_MS });
}

/** Invalidate cached reads by exact key or prefix (e.g. `vs:tenants`). */
export function invalidateApexCaches(prefix?: string): void {
  if (!prefix) {
    readCache.clear();
    return;
  }
  for (const key of [...readCache.keys()]) {
    if (key === prefix || key.startsWith(prefix)) readCache.delete(key);
  }
}

/** Cache-first read with in-flight dedupe — concurrent callers share one request. */
export async function dedupeApexRead<T>(key: string, run: () => Promise<T>): Promise<T> {
  const cached = readListCache<T>(key);
  if (cached != null) return cached;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const task = (async () => {
    try {
      const result = await run();
      writeListCache(key, result);
      return result;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, task);
  return task;
}

/* ------------------------------------------------------------------ */
/* Login — POST /api/auth/login/ returns a RAW body (no `{data}` wrap)  */
/* ------------------------------------------------------------------ */

export type ApexLoginUser = {
  id: number;
  username: string;
  name: string | null;
  role: string;
  tenant: string | null;
  tenant_id: number | null;
  must_change_password?: boolean;
};

export type ApexLoginResult = {
  access: string;
  refresh: string;
  user: ApexLoginUser;
};

export async function apexLoginAction(
  username: string,
  password: string,
): Promise<ApexLoginResult> {
  const response = await fetch(`${ADMIN_API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim(), password }),
  });

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      extractMessage(body) ?? "Invalid credentials.",
      response.status,
    );
  }

  const data = body as ApexLoginResult;
  if (!data?.access) {
    throw new ApiError("Login succeeded but no access token was returned.");
  }

  const member: ApexMember = {
    id: data.user?.id ?? 0,
    username: data.user?.username ?? username.trim(),
    name: data.user?.name ?? null,
    role: data.user?.role ?? "APEX",
  };
  persistApexSession(data.access, member);
  return data;
}

/** Human-friendly login error — falls back to the backend's generic message. */
export function mapLoginError(error: unknown): string {
  const mapped = mapApiError(error, "");
  const raw = (mapped || (error instanceof Error ? error.message : String(error ?? ""))).trim();
  return raw || "Login failed";
}
