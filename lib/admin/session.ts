import { toast } from "sonner";

/**
 * Apex console session storage — owned by the shared admin data layer.
 * Keys: `vs_auth_token` / `vs_member` (browser localStorage only).
 */
const TOKEN_KEY = "vs_auth_token";
const MEMBER_KEY = "vs_member";

const LOGIN_PATH = "/";
const TOAST_ID = "vs-session-expired";

export type ApexMember = {
  id: number;
  username: string;
  name: string | null;
  role: string;
};

export function getApexToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setApexToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getApexMember(): ApexMember | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApexMember;
  } catch {
    return null;
  }
}

export function persistApexSession(token: string, member: ApexMember): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function clearApexSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(MEMBER_KEY);
}

let redirectScheduled = false;

/** One-shot 401 handler: toast, clear the session, then land on the login page. */
export function scheduleApexSessionExpiredRedirect(): void {
  if (typeof window === "undefined") return;
  if (redirectScheduled) return;
  redirectScheduled = true;
  toast.error("Your session has expired. Please sign in again.", {
    id: TOAST_ID,
    duration: 8000,
  });
  clearApexSession();
  window.setTimeout(() => {
    window.location.href = LOGIN_PATH;
  }, 1200);
}
