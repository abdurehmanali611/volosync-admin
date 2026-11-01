import { dedupeApexRead, invalidateApexCaches, request } from "./core";

/* ------------------------------------------------------------------ */
/* REST types — every shape mirrors docs/api-additions.md               */
/* ------------------------------------------------------------------ */

export type TenantDetail = {
  id: number;
  name: string;
  tin: string;
  phone: string;
  address: string;
  logo_url: string;
  vat_rate: string;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  sales_agent: number | null;
  sales_agent_name: string | null;
  parent: number | null;
  parent_name: string | null;
  is_main: boolean;
  is_branch: boolean;
  subscription_expires_on: string | null;
  subscription_transaction_id: string;
  subscription_paid_on: string | null;
  subscription_note: string;
  subscription_state: string;
  annual_fee: string;
  created_at: string | null;
  next_renewal_date: string | null;
  suggested_annual_fee: string | null;
  counts: {
    staff: number;
    branches: number;
    lots: number;
    payments: number;
    setup_payments: number;
    module_requests: number;
  };
  stock_value: string;
};

export type OwnerAccount = {
  id: number;
  username: string;
  email: string;
  name: string;
  last_login: string | null;
  must_change_password: boolean;
};

export type StaffRow = {
  id: number;
  profile_id: number;
  username: string;
  name: string;
  role: string;
  phone: string;
  last_login: string | null;
  must_change_password: boolean;
  is_active: boolean;
  tenant?: string;
  tenant_id?: number;
};

export type BranchRow = {
  id: number;
  name: string;
  tin: string;
  parent: number;
  is_main: boolean;
  is_branch: boolean;
  subscription_state: string;
  subscription_expires_on: string | null;
  annual_fee: string;
  staff_count: number;
};

export type PaymentRow = {
  id: number;
  tenant: number;
  tenant_name: string;
  transaction_id: string;
  transaction_ref: string;
  channel: string;
  status: string;
  amount: string;
  years: number;
  paid_on: string | null;
  covers_until: string | null;
  note: string;
  submitted_by: string;
  submitted_at: string | null;
  decided_by: string;
  decided_at: string | null;
  decision_note: string;
};

export type SetupPaymentRow = {
  id: number;
  tenant: string;
  tenant_id: number;
  amount: string;
  transaction_ref: string;
  channel: string;
  status: string;
  note: string;
  decided_by: string;
  decided_at: string | null;
  decision_note: string;
  created_at: string;
};

export type ModuleRequestRow = {
  id: number;
  tenant: string;
  tenant_id: number;
  requested_modules: string;
  note: string;
  status: string;
  created_at: string;
  decided_at: string | null;
};

export type PricingPlan = {
  id: number;
  name: string;
  setup_fee: string;
  yearly_base_fee: string;
  inventory_yearly_fee: string;
  hr_yearly_fee: string;
  sales_role_yearly_fee: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
};

export type SalesAgent = {
  id: number;
  name: string;
  phone: string;
  email: string;
  sex: string;
  active: boolean;
  notes: string;
  created_at: string;
};

export type CatalogModule = {
  code: string;
  name: string;
  description: string;
  yearly_fee: string | null;
  active_for_platform: boolean;
  always_on: boolean;
  requestable: boolean;
};

export type ModulesCatalog = {
  modules: CatalogModule[];
  plan: PricingPlan | null;
  sales_role_enabled_fee: string | null;
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

export type FeedbackRow = {
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

export type SignupRow = {
  id: number;
  name: string;
  tin: string;
  created_at: string;
  sales_agent: string;
  is_branch: boolean;
  subscription_state: string;
  setup_status: string;
  setup_amount: string | null;
  setup_ref: string;
  module_inventory: boolean;
  module_hr: boolean;
};

const list = <T>(value: T[] | null): T[] => (Array.isArray(value) ? value : []);

/* ------------------------------------------------------------------ */
/* Reads (cached + deduped)                                            */
/* ------------------------------------------------------------------ */

export const fetchTenantDetail = (id: number | string) =>
  dedupeApexRead(`vs:tenant:${id}`, () =>
    request<TenantDetail>(`/api/tenants/${id}/`),
  );

export const fetchOwner = (id: number | string) =>
  request<OwnerAccount | null>(`/api/tenants/${id}/owner/`);

export const fetchTenantStaff = (id: number | string) =>
  dedupeApexRead(`vs:tenant:${id}:staff`, async () =>
    list(await request<StaffRow[] | null>(`/api/tenants/${id}/staff/`)),
  );

export const fetchTenantPayments = (id: number | string) =>
  dedupeApexRead(`vs:tenant:${id}:payments`, async () =>
    list(await request<PaymentRow[] | null>(`/api/tenants/${id}/payments/`)),
  );

export const fetchBranches = (id: number | string) =>
  dedupeApexRead(`vs:tenant:${id}:branches`, async () =>
    list(await request<BranchRow[] | null>(`/api/tenants/${id}/branches/`)),
  );

export const fetchSetupPayments = () =>
  dedupeApexRead("vs:setup-payments", async () =>
    list(
      await request<SetupPaymentRow[] | null>("/api/tenants/setup-payments/"),
    ),
  );

export const fetchSubscriptionLedger = () =>
  dedupeApexRead("vs:subscriptions", async () =>
    list(await request<PaymentRow[] | null>("/api/tenants/subscriptions/")),
  );

export const fetchModuleRequests = () =>
  dedupeApexRead("vs:module-requests", async () =>
    list(
      await request<ModuleRequestRow[] | null>("/api/tenants/module-requests/"),
    ),
  );

export const fetchPricingPlans = () =>
  dedupeApexRead("vs:pricing", async () =>
    list(await request<PricingPlan[] | null>("/api/pricing/")),
  );

export const fetchSalesAgents = () =>
  dedupeApexRead("vs:sales-agents", async () =>
    list(await request<SalesAgent[] | null>("/api/sales-agents/")),
  );

export const fetchCatalog = () =>
  dedupeApexRead("vs:catalog", () =>
    request<ModulesCatalog>("/api/modules/catalog/"),
  );

export const fetchAllStaff = () =>
  dedupeApexRead("vs:staff", async () =>
    list(await request<StaffRow[] | null>("/api/tenants/staff/")),
  );

export const fetchAudit = () =>
  dedupeApexRead("vs:audit", async () =>
    list(await request<AuditRow[] | null>("/api/tenants/audit/")),
  );

export const fetchFeedback = () =>
  dedupeApexRead("vs:feedback", async () =>
    list(await request<FeedbackRow[] | null>("/api/tenants/feedback/")),
  );

export const fetchSignups = () =>
  dedupeApexRead("vs:signups", async () =>
    list(await request<SignupRow[] | null>("/api/tenants/signups/")),
  );

/* ------------------------------------------------------------------ */
/* Mutations — each one busts the read caches it invalidates           */
/* ------------------------------------------------------------------ */

export type CreateTenantInput = {
  name: string;
  tin: string;
  username: string;
  password: string;
  /** Public Cloudinary URL from `uploadImage()` — empty when skipped. */
  logo_url?: string;
  sales_agent?: number | null;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
};

export async function createTenant(input: CreateTenantInput) {
  const body = await request<{ data: TenantDetail; manager: string }>(
    "/api/tenants/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  invalidateApexCaches();
  return body;
}

export async function updateTenant(
  id: number | string,
  patch: Record<string, unknown>,
) {
  const body = await request<{
    data: TenantDetail;
    suggested_annual_fee: string | null;
    fee_applied: boolean;
  }>(`/api/tenants/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
  invalidateApexCaches();
  return body;
}

/** Replace only the tenant's logo — leaves name, TIN and modules untouched. */
export async function updateTenantLogo(id: number | string, logoUrl: string) {
  return updateTenant(id, { logo_url: logoUrl });
}

export async function createOwner(
  id: number | string,
  payload: { username: string; password: string; email?: string },
) {
  return request<OwnerAccount>(`/api/tenants/${id}/owner/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOwner(
  id: number | string,
  payload: { username?: string; email?: string },
) {
  return request<OwnerAccount>(`/api/tenants/${id}/owner/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(userId: number, password?: string) {
  return request<{
    id: number;
    username: string;
    password: string;
    generated: boolean;
    must_change_password: boolean;
  }>(`/api/tenants/staff/${userId}/reset-password/`, {
    method: "POST",
    body: JSON.stringify(password ? { password } : {}),
  });
}

export async function decideSubscription(
  id: number,
  decision: "APPROVED" | "REJECTED",
  note = "",
) {
  const body = await request<PaymentRow>(
    `/api/payments/subscription/${id}/decision/`,
    {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    },
  );
  invalidateApexCaches();
  return body;
}

export async function decideSetupPayment(
  id: number,
  status: "APPROVED" | "REJECTED",
  note = "",
) {
  const body = await request<{ id: number; status: string }>(
    "/api/tenants/setup-payments/",
    { method: "PATCH", body: JSON.stringify({ id, status, note }) },
  );
  invalidateApexCaches();
  return body;
}

export async function decideModuleRequest(
  id: number,
  status: "APPROVED" | "REJECTED",
) {
  const body = await request<{ id: number; status: string }>(
    "/api/tenants/module-requests/",
    { method: "PATCH", body: JSON.stringify({ id, status }) },
  );
  invalidateApexCaches();
  return body;
}

export async function savePricingPlan(
  input: Partial<PricingPlan> & { name: string },
  id?: number,
) {
  const body = await request<PricingPlan>(
    id ? `/api/pricing/${id}/` : "/api/pricing/",
    { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
  );
  invalidateApexCaches();
  return body;
}

export async function deletePricingPlan(id: number) {
  const body = await request<{ id: number; deleted: boolean }>(
    `/api/pricing/${id}/`,
    {
      method: "DELETE",
    },
  );
  invalidateApexCaches();
  return body;
}

export async function saveSalesAgent(
  input: Partial<SalesAgent> & { name: string },
  id?: number,
) {
  const body = await request<SalesAgent>(
    id ? `/api/sales-agents/${id}/` : "/api/sales-agents/",
    {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    },
  );
  invalidateApexCaches();
  return body;
}

export async function updateFeedbackStatus(id: number, status: string) {
  const body = await request<{ id: number; status: string }>(
    "/api/tenants/feedback/",
    {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    },
  );
  invalidateApexCaches();
  return body;
}

/** Fields the create-tenant form sends — Credentials is implicit and always on. */
export const TENANT_MODULE_OPTIONS = [
  { key: "credentials", label: "Credentials", locked: true },
  { key: "module_inventory", label: "Inventory", locked: false },
  { key: "module_hr", label: "HR", locked: false },
] as const;
