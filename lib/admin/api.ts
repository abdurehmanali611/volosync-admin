import { getApexToken, setApexToken } from "./session";

export const BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_ADMIN_API_URL ??
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

/** Token storage delegated to `lib/admin/session.ts` (keys `vs_auth_token`/`vs_member`). */
export function getToken(): string | null {
  return getApexToken();
}

export function setToken(token: string | null) {
  setApexToken(token);
}

export class AdminError extends Error {}

export async function admin<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (response.status === 401) {
    setToken(null);
    throw new AdminError("Session expired — sign in again.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = (body ?? {}) as {
      errors?: { message?: string } | string;
      detail?: string;
    };
    const message =
      (typeof err.errors === "object" ? err.errors?.message : err.errors) ??
      err.detail ??
      "Request failed.";
    throw new AdminError(String(message));
  }
  return body as T;
}

export const money = (value: string | number | null | undefined) =>
  `ETB ${Number(value ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

export type Tenant = {
  id: number;
  name: string;
  tin: string;
  phone: string;
  address: string;
  vat_rate: string;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  parent: number | null;
  is_main: boolean;
  is_branch: boolean;
  subscription_expires_on: string | null;
  subscription_transaction_id: string;
  subscription_state: string;
  staff_count: number;
  branch_count: number;
  lot_count: number;
  stock_value: string;
};

export type Dashboard = {
  companies: number;
  branches: number;
  active: number;
  due_soon: number;
  expired: number;
  year_revenue: string;
  payments: number;
  stock_value: string;
  staff: number;
};

export type Payment = {
  id: number;
  tenant: number;
  tenant_name: string;
  transaction_id: string;
  amount: string;
  years: number;
  paid_on: string;
  covers_until: string;
  note: string;
  recorded_by: string;
};

export type Staff = {
  id: number;
  username: string;
  name: string;
  role: string;
  tenant: string;
  last_login: string | null;
};

export type Feedback = {
  id: number;
  tenant: string;
  subject: string;
  body: string;
  category: string;
  status: string;
  contact: string;
  unread: boolean;
  created_at: string;
};

export type AuditRow = {
  id: number;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: string;
  at: string;
};

export type SetupPayment = {
  id: number;
  tenant: string;
  tenant_id: number;
  amount: string;
  transaction_ref: string;
  channel: string;
  status: string;
  note: string;
  created_at: string;
};

export type ModuleRequest = {
  id: number;
  tenant: string;
  tenant_id: number;
  requested_modules: string;
  note: string;
  status: string;
  created_at: string;
};

export type SalesAgent = {
  id: number;
  agent_name: string;
  login_username: string;
  phone: string;
  sex: string;
  years_experience: number;
  is_active: boolean;
  tenant_name?: string;
};

export const stateTone: Record<string, string> = {
  ACTIVE: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  DUE_SOON: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  EXPIRED: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  UNPAID: "border-white/20 bg-white/5 text-zinc-400",
  PENDING: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  APPROVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  REJECTED: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  OPEN: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  READ: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  RESOLVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};
