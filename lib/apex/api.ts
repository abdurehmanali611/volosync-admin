import axios from "axios";
import { getApexToken } from "./auth";
import {
  ApexSessionExpiredError,
  apiMessageIndicatesApexSessionExpiry,
  isApexSessionExpiredError,
  scheduleApexSessionExpiredRedirect,
} from "./sessionExpiry";

/**
 * Apex console transport — Django REST client.
 * One REST endpoint per operation, base URL from `.env.local`
 * (`NEXT_PUBLIC_API_URL`), JWT bearer from the Apex session.
 */
export const APEX_BACKEND_BASE = "https://volosync-flsh.vercel.app";

function normalizeApiBaseUrl(raw: string | undefined): string {
  const fallback = APEX_BACKEND_BASE;
  const s = (raw ?? fallback).trim() || fallback;
  return s.replace(/\/+$/, "");
}

const API_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_API_URL,
);

function resolveApexTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_APEX_TIMEOUT_MS;
  const n = raw ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 10_000 && n <= 300_000) return n;
  return 60_000;
}

export const APEX_API_TIMEOUT_MS = resolveApexTimeoutMs();

/** `GET /api/…` paths are always trailing-slash terminated for Django. */
export function apexPath(path: string): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  const [base, query] = trimmed.split("?");
  const withSlash = /\/$|\.[a-z0-9]+$/i.test(base) ? base : `${base}/`;
  return query ? `${withSlash}?${query}` : withSlash;
}

const apexApi = axios.create({
  baseURL: API_URL,
  timeout: APEX_API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

apexApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getApexToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Message wording the console shows for a failed call. */
function firstErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = body as { errors?: unknown; detail?: unknown; message?: unknown };
  const errors = data.errors;
  if (typeof errors === "string" && errors.trim()) return errors.trim();
  if (Array.isArray(errors)) {
    const first = errors[0] as { message?: unknown } | string | undefined;
    const msg = typeof first === "string" ? first : first?.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (errors && typeof errors === "object") {
    const msg = (errors as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    const nested = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(nested) && typeof nested[0] === "string") {
      return String(nested[0]).trim();
    }
  }
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  return null;
}

/** `{data, meta}` success envelope; everything else is a flat body. */
export type ApexListMeta = Record<string, unknown> & {
  total?: number;
  limit?: number;
  offset?: number;
};

export type ApexEnvelope<T> = { data: T; meta: ApexListMeta };

function unwrap<T>(body: unknown): ApexEnvelope<T> {
  if (body && typeof body === "object" && "data" in body) {
    const envelope = body as { data: T; meta?: ApexListMeta };
    return { data: envelope.data, meta: envelope.meta ?? {} };
  }
  return { data: body as T, meta: {} };
}

export async function apexRequest<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    params?: Record<string, unknown>;
    raw?: boolean;
    timeoutMs?: number;
  } = {},
): Promise<ApexEnvelope<T>> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  try {
    const response = await apexApi.request({
      url: apexPath(path),
      method: (init.method ?? "GET") as never,
      data: init.body,
      params: init.params,
      responseType: init.raw ? "blob" : undefined,
      timeout: init.timeoutMs ?? APEX_API_TIMEOUT_MS,
      // A FormData body needs the browser's own multipart boundary.
      headers: isForm ? { "Content-Type": undefined } : undefined,
    });
    return init.raw ? ({ data: response.data as T, meta: {} } as ApexEnvelope<T>) : unwrap<T>(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        scheduleApexSessionExpiredRedirect();
        throw new ApexSessionExpiredError();
      }
      throw new Error(
        firstErrorMessage(error.response?.data) ??
          (error.response
            ? `Request failed (HTTP ${error.response.status}).`
            : error.message),
      );
    }
    throw error;
  }
}

/** GET — the `{data}` envelope is unwrapped for the caller. */
export async function apexGet<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  return (await apexRequest<T>(path, { method: "GET", params })).data;
}

/** GET list read that also needs the server-side counts in `meta`. */
export async function apexList<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<{ rows: T[]; total: number; meta: ApexListMeta }> {
  const { data, meta } = await apexRequest<T[]>(path, { method: "GET", params });
  const rows = Array.isArray(data) ? data : [];
  return { rows, total: Number(meta.total ?? rows.length), meta };
}

export async function apexSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options?: { timeoutMs?: number },
): Promise<T> {
  return (await apexRequest<T>(path, { method, body, timeoutMs: options?.timeoutMs })).data;
}

export const apexPost = <T>(
  path: string,
  body?: unknown,
  options?: { timeoutMs?: number },
) => apexSend<T>("POST", path, body, options);
export const apexPatch = <T>(path: string, body?: unknown) => apexSend<T>("PATCH", path, body);
export const apexDelete = <T>(path: string, body?: unknown) => apexSend<T>("DELETE", path, body);

export function apexAuthHeader(): Record<string, string> {
  const token = getApexToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fileNameFromDisposition(value: string | null): string | null {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(value ?? "");
  return match ? match[1].trim() : null;
}

/** Authenticated binary download (Excel templates) handed to the browser. */
export async function downloadApexFile(path: string, fallbackName: string): Promise<string> {
  const response = await fetch(`${API_URL}${apexPath(path)}`, {
    headers: apexAuthHeader(),
  });

  if (response.status === 401) {
    scheduleApexSessionExpiredRedirect();
    throw new ApexSessionExpiredError();
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    throw new Error(firstErrorMessage(body) ?? `Download failed (HTTP ${response.status}).`);
  }

  const name = fileNameFromDisposition(response.headers.get("Content-Disposition")) ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return name;
}

/**
 * Human-readable failure text for the console. An expired session returns ""
 * so callers stay silent while sessionExpiry redirects to the login page.
 */
export function mapApexApiError(error: unknown, fallback = "Request failed"): string {
  if (isApexSessionExpiredError(error)) return "";

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return `Request timed out (>${APEX_API_TIMEOUT_MS / 1000}s). The backend may still be waking up — try again.`;
    }
    if (!error.response) {
      return `Cannot reach the Apex API at ${API_URL}. Check that the Django backend is running and NEXT_PUBLIC_API_URL points at it.`;
    }
    const msg = firstErrorMessage(error.response.data);
    if (msg) {
      return apiMessageIndicatesApexSessionExpiry(msg) ? "" : msg;
    }
    if (error.response.status === 401) return "";
    if (error.response.status === 403) {
      return "Your Apex account is not allowed to do this.";
    }
    if (error.response.status === 404) {
      return "Not found.";
    }
    if (error.response.status >= 500) {
      return `Apex API returned HTTP ${error.response.status}. Check the Django server logs.`;
    }
  }

  if (error instanceof Error && error.message) {
    if (apiMessageIndicatesApexSessionExpiry(error.message)) return "";
    return error.message;
  }
  return fallback;
}
