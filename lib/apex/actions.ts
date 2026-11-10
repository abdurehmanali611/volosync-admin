import { apexGet, apexList, apexPatch, apexPost, apexDelete } from "./api";
import { mapApexApiError } from "./api";
import {
  invalidateApexListCache,
  readListCache,
  writeListCache,
} from "./listCache";
import { persistApexSession, type ApexMember } from "./auth";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";

/* ------------------------------------------------------------------ */
/* Vocabulary — Django REST codes → the console's lowercase statuses    */
/* ------------------------------------------------------------------ */

const n = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const str = (value: unknown): string => (value == null ? "" : String(value));

const lower = (value: unknown): string => str(value).trim().toLowerCase();

/** `ACTIVE` → `active`, `DUE_SOON` → `due_soon`. */
const status = (value: unknown): string => lower(value);

const bool = (value: unknown): boolean =>
  value === true || str(value).toLowerCase() === "true" || value === 1 || value === "1";

/**
 * Django's `billing_state`/`subscription_state` pair → the console's renewal
 * standing: active · warning · grace · expired · trial · exempt · setup_pending.
 */
function subscriptionStanding(billingState: unknown, subscriptionState: unknown): string {
  const billing = upper(billingState);
  switch (billing) {
    case "EXEMPT":
      return "exempt";
    case "TRIAL":
    case "TRIAL_ENDING":
      return "trial";
    case "TRIAL_EXPIRED":
    case "EXPIRED":
      return "expired";
    case "ON_HOLD":
    case "GRACE":
      return "grace";
    case "DUE_SOON":
      return "warning";
    case "ACTIVE":
      return "active";
    case "UNPAID":
      return "setup_pending";
    default:
      break;
  }
  const sub = upper(subscriptionState);
  if (sub === "UNPAID") return "setup_pending";
  if (sub === "EXPIRED") return "expired";
  if (sub === "DUE_SOON") return "warning";
  return "active";
}

const upper = (value: unknown): string => str(value).trim().toUpperCase();

/** `APPROVED` → `approved` — the casing every table filter matches on. */
const reviewStatus = (value: unknown): SignupReviewStatus => {
  const raw = lower(value);
  if (raw.startsWith("approv") || raw === "paid") return "approved";
  if (raw.startsWith("reject") || raw === "declined" || raw === "denied") return "rejected";
  return "pending";
};

/* ------------------------------------------------------------------ */
/* Row shapes (identical to the reference console, yearly-only)         */
/* ------------------------------------------------------------------ */

export type DashboardSummary = {
  pendingSetupPayments: number;
  pendingYearlyPayments: number;
  unreadFeedback: number;
  suspendedTenants: number;
  bannedTenants: number;
  setupPendingTenants: number;
  inactiveTenants: number;
  billingHoldTenants: number;
  graceOrExpiredTenants: number;
  trialsEndingSoon: number;
  trialExpiredTenants: number;
  totalTenants: number;
  totalUsers: number;
  disabledUsers: number;
  tenantsByBusinessType: { businessType: string; label: string; count: number }[];
};

export type SignupPipelineRow = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  ownerUserName: string;
  managerUsername: string | null;
  setupFeeETB: number;
  paymentTransactionRef: string | null;
  paymentChannel: string | null;
  registeredAt: string;
  pendingSetupPaymentId: number | null;
  salesAgentId?: number | null;
  salesAgentName?: string | null;
};

export type SignupReviewStatus = "pending" | "approved" | "rejected";

/** Wholesaler signed up in the current calendar month, with setup review status. */
export type MonthlySignupRow = SignupPipelineRow & {
  status: SignupReviewStatus;
  subscriptionStatus: string;
};

export type TenantBillingInput = {
  setupFeeETB?: number;
  yearlyFeeETB?: number;
  billingNotes?: string | null;
  isIllustrationTenant?: boolean;
  billingHold?: boolean;
  billingHoldNote?: string;
  freeTrialEndsAt?: string | null;
};

export type PricingRuleRow = {
  id: number;
  businessType: string;
  modulesKey: string;
  modules: string[];
  setupFeeETB: number;
  yearlyFeeETB: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  /** VoloSync plans price each module separately. */
  inventoryYearlyFeeETB?: number;
  hrYearlyFeeETB?: number;
  salesRoleYearlyFeeETB?: number;
  isDefault?: boolean;
};

export type PricingRuleInput = {
  id?: number;
  businessType: string;
  modules: string[];
  setupFeeETB: number;
  yearlyFeeETB: number;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  inventoryYearlyFeeETB?: number;
  hrYearlyFeeETB?: number;
  salesRoleYearlyFeeETB?: number;
};

export type TenantListItem = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  billingState: string;
  setupFeeApproved: boolean;
  setupFeeETB: number;
  yearlyFeeETB: number;
  ownerUserName: string;
  managerUsername: string | null;
  createdAt: string | null;
  billingHold: boolean;
  isIllustrationTenant: boolean;
  unreadFeedback: number;
  logoUrl?: string | null;
  staffCount: number;
  branchCount: number;
  lotCount: number;
  stockValueETB: number;
  parentName?: string | null;
  parentTin?: string | null;
  isBranch: boolean;
  isMain: boolean;
  daysToRenewal?: number | null;
  salesAgentId?: number | null;
  salesAgentName?: string | null;
};

/** One module switch line — the yearly price comes from the active plan. */
export type TenantModuleLine = {
  code: string;
  name: string;
  alwaysOn: boolean;
  enabled: boolean;
  yearlyFeeETB: number | null;
};

export type TenantUserRow = {
  id: number;
  UserName: string;
  displayName: string;
  Role: string;
  loginDisabled: boolean;
  loginDisabledReason: string | null;
  createdAt: string;
};

export type TenantPaymentRow = {
  id: number;
  paymentKind: string;
  amountETB: number;
  status: string;
  transactionRef: string;
  submittedAt: string;
  years?: number;
};

export type TenantFamilyMember = {
  id: number;
  tinNumber: string;
  name: string;
  isMain: boolean;
  isRoot: boolean;
  logoUrl: string | null;
};

export type TenantDetail = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  parentName: string | null;
  parentTin: string | null;
  isBranch: boolean;
  isMain: boolean;
  isRoot: boolean;
  family: TenantFamilyMember[];
  logoUrl: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  billingState: string;
  modules: string[];
  moduleLines: TenantModuleLine[];
  setupFeeETB: number;
  yearlyFeeETB: number;
  suggestedSetupFeeETB: number;
  suggestedYearlyFeeETB: number;
  feesManuallySet: boolean;
  feesMatchCatalog: boolean;
  setupFeeApproved: boolean;
  subscriptionPaymentApproved: boolean;
  subscriptionPaidUntil: string | null;
  paidYearsCount: number;
  billingHold: boolean;
  billingHoldNote: string;
  billingStartedAt: string | null;
  isIllustrationTenant: boolean;
  freeTrialEndsAt: string | null;
  trialDaysLeft: number | null;
  daysToRenewal: number | null;
  nextRenewalDate: string | null;
  billingNotes: string | null;
  paymentChannel: string | null;
  paymentTransactionRef: string | null;
  planName: string | null;
  ownerUserName: string;
  phone: string;
  address: string;
  vatRate: number;
  suspendedReason: string | null;
  bannedReason: string | null;
  deletedReason: string | null;
  users: TenantUserRow[];
  recentPayments: TenantPaymentRow[];
  operationalSnapshot: {
    staffCount: number;
    branchCount: number;
    lotCount: number;
    stockValueETB: number;
    paymentsCount: number;
    setupPaymentsCount: number;
    pendingPurchaseRequests?: number;
    pendingStockOutRequests?: number;
    pendingItemRegistrations?: number;
    openOrders?: number;
    ordersToday?: number;
  };
  chat: {
    threadId: number | null;
    status: string | null;
    subject: string;
    unreadFromTenant: number;
    messages: number;
  };
  salesRoleEnabled: boolean;
  salesAgentId?: number | null;
  salesAgentName?: string | null;
};

export type PaymentRow = {
  id: number;
  tenantId: number;
  tinNumber: string;
  paymentKind: string;
  amountETB: number;
  paymentChannel: string;
  transactionRef: string;
  status: string;
  submittedAt: string;
  hotelDisplayName: string | null;
  years?: number;
  salesAgentId?: number | null;
  salesAgentName?: string | null;
};

export type TenantUserMonitoringRow = {
  id: number;
  userName: string;
  displayName: string;
  role: string;
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string;
  loginDisabled: boolean;
  loginDisabledReason: string | null;
  createdAt: string | null;
};

export type AuditLogRow = {
  id: number;
  action: string;
  targetTinNumber: string | null;
  targetUserId: number | null;
  reason: string | null;
  apexMemberName: string | null;
  createdAt: string;
  category?: string;
  detail?: string;
};


export type FeedbackThreadRow = {
  id: number;
  tenantId: number;
  tinNumber: string;
  hotelDisplayName: string;
  status: string;
  unreadFromTenant: number;
  updatedAt: string;
  lastMessage?: { body: string; senderSide: string; createdAt: string } | null;
};

export type FeedbackDirectoryRow = {
  tenantId: number;
  tinNumber: string;
  hotelDisplayName: string;
  logoUrl?: string | null;
  threadId: number | null;
  chatStatus: string;
  unreadFromTenant: number;
  updatedAt: string | null;
  lastMessage?: { body: string; senderSide: string; createdAt: string } | null;
};

export type FeedbackThreadDetail = {
  id: number;
  tenantId: number;
  tinNumber: string;
  hotelDisplayName: string;
  status: string;
  messages: {
    id: number;
    senderSide: string;
    tenantUserName: string | null;
    apexDisplayName: string | null;
    body: string;
    imageUrl: string | null;
    createdAt: string;
  }[];
};

export type SignupPricingPreview = {
  setupFeeETB: number;
  yearlyFeeETB: number;
  source: string;
};

export type TenantOnboardingResult = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  ownerUserName: string;
  ownerRole: string;
  setupFeeETB: number;
  setupFeeApproved: boolean;
  userId: number;
};

export type TenantWithoutOwnerRow = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  hasStaffUsers: boolean;
};

export type OwnerAccountRow = {
  id: number;
  userName: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  propertyCount: number;
  createdAt: string;
};

export type ApexCreateTenantInput = {
  businessName: string;
  userName: string;
  password: string;
  businessType: string;
  modules: string[];
  logoUrl?: string | null;
  tinNumber?: string | null;
  paymentChannel?: string | null;
  paymentTransactionRef?: string | null;
  confirmPaymentReceived?: boolean;
  isIllustrationTenant?: boolean;
  billingNotes?: string | null;
  salesAgentId?: number | null;
};

export type SalesAgentRow = {
  id: number;
  displayName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  tenantCount: number;
};

export type ApexCreateTenantOwnerInput = {
  tinNumber: string;
  userName: string;
  password: string;
  logoUrl?: string | null;
  paymentChannel?: string | null;
  paymentTransactionRef?: string | null;
  confirmPaymentReceived?: boolean;
};

export type ApexCreateOwnerAccountInput = {
  userName: string;
  password: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  linkTinNumber?: string | null;
};

/* ------------------------------------------------------------------ */
/* Cache plumbing                                                       */
/* ------------------------------------------------------------------ */

const listInflight = new Map<string, Promise<unknown>>();

export function dedupeApexRead<T>(key: string, run: () => Promise<T>): Promise<T> {
  const cached = readListCache<T>(key);
  if (cached != null) return Promise.resolve(cached);

  const existing = listInflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      const result = await run();
      writeListCache(key, result);
      return result;
    } finally {
      listInflight.delete(key);
    }
  })();
  listInflight.set(key, p);
  return p;
}

export function invalidateApexCaches(prefix?: string): void {
  invalidateApexListCache(prefix);
}

function invalidateTenantDetailCaches() {
  invalidateApexCaches("apex:tenant:");
  invalidateApexCaches("apex:tenant-payments:");
}

function afterPaymentMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:payments");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:signups");
  invalidateTenantDetailCaches();
}

function afterTenantAccountMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:signups");
  invalidateTenantDetailCaches();
}

function afterUserMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:users");
  invalidateTenantDetailCaches();
}

function afterBillingMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:payments");
  invalidateTenantDetailCaches();
}

function afterModuleMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:tenants");
  invalidateTenantDetailCaches();
}

function afterPricingMutation() {
  invalidateApexCaches("apex:pricing");
  invalidateApexCaches("apex:tenants");
  invalidateTenantDetailCaches();
}

function afterOnboardingMutation() {
  invalidateApexCaches();
}

/* ------------------------------------------------------------------ */
/* TIN ↔ Django primary key                                             */
/* The reference console addresses wholesalers by TIN; this backend     */
/* routes on the numeric pk, so every call resolves through the index.  */
/* ------------------------------------------------------------------ */

type TenantRef = { id: number; tinNumber: string; hotelDisplayName: string; businessType: string };

const refOf = (row: Record<string, unknown>): TenantRef => ({
  id: n(row.id ?? row.tenant_id ?? row.pk),
  tinNumber: str(row.tin),
  hotelDisplayName: str(row.name ?? row.hotelDisplayName ?? row.tenant),
  businessType: bool(row.is_branch) ? "Branch" : "Company",
});

async function tenantIndex(): Promise<TenantRef[]> {
  return dedupeApexRead("apex:tenants:index", async () => {
    const pages = await Promise.all([
      apexList<Record<string, unknown>>("/api/tenants", { limit: 1000 }),
      apexList<Record<string, unknown>>("/api/tenants", {
        limit: 1000,
        access: "DELETED",
      }).catch(() => ({ rows: [] as Record<string, unknown>[], total: 0 })),
    ]);
    const seen = new Set<number>();
    const refs: TenantRef[] = [];
    for (const row of pages[0].rows.concat(pages[1].rows)) {
      const ref = refOf(row);
      if (ref.id && !seen.has(ref.id)) {
        seen.add(ref.id);
        refs.push(ref);
      }
    }
    return refs;
  });
}

/** TIN (or an already-resolved pk) → the pk every Django route wants. */
export async function resolveTenantId(ref: string | number): Promise<number> {
  if (typeof ref === "number") {
    if (!Number.isFinite(ref) || ref <= 0) throw new Error(`Invalid wholesaler id ${ref}.`);
    return ref;
  }
  const wanted = String(ref).trim().toLowerCase();
  if (!wanted) throw new Error("No wholesaler identifier provided.");
  const index = await tenantIndex();
  const cached = index.find((row) => row.tinNumber.toLowerCase() === wanted);
  if (cached) return cached.id;
  // TINs are digit strings, so a missing ref must be searched, never cast to a pk.
  const page = await apexList<Record<string, unknown>>("/api/tenants", {
    search: wanted,
    limit: 20,
  }).catch(() => null);
  const rows = (page?.rows ?? []).map(refOf).filter((row) => row.id);
  const hit = rows.find((row) => row.tinNumber.toLowerCase() === wanted);
  if (hit) return hit.id;
  throw new Error(`No wholesaler with TIN ${ref}.`);
}

async function tinOfTenant(id: number | string): Promise<string | null> {
  const index = await tenantIndex();
  return index.find((row) => row.id === n(id))?.tinNumber ?? null;
}

/* ------------------------------------------------------------------ */
/* Login                                                              */
/* ------------------------------------------------------------------ */

export function mapApexLoginError(error: unknown): string {
  const mapped = mapApexApiError(error, "");
  const raw = (mapped || (error instanceof Error ? error.message : String(error ?? ""))).trim();
  const m = raw.toLowerCase();
  if (m.includes("invalid username or password") || m.includes("account is not active")) {
    return "Invalid username or password.";
  }
  return raw || "Login failed";
}

type LoginBody = {
  access: string;
  refresh: string;
  user: { id: number; username: string; name: string | null; role: string };
};

export async function apexLoginAction(
  UserName: string,
  Password: string,
): Promise<{ token: string; member: ApexMember }> {
  const body = await apexPost<LoginBody>("/api/auth/login", {
    username: UserName.trim(),
    password: Password,
  });
  const member: ApexMember = {
    id: body.user?.id ?? 0,
    UserName: body.user?.username ?? UserName.trim(),
    displayName: body.user?.name ?? null,
    role: body.user?.role ?? "APEX",
  };
  persistApexSession(body.access, member);
  return { token: body.access, member };
}

/* ------------------------------------------------------------------ */
/* Row mappers                                                        */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

function axisOf(row: Json): string {
  return bool(row.is_branch) || row.parent != null ? "Branch" : "Company";
}

/** Backend lines and legacy payloads use aliases ("Sales role", "HR"); the
 * console keys checkboxes, plans and pricing by canonical display names. */
function canonicalModuleName(name: unknown): string | null {
  const value = String(name ?? "").trim().toLowerCase();
  if (value === "inventory") return "Inventory";
  if (value === "hr" || value === "hr module") return "HR Module";
  if (value === "sales" || value === "sales role") return "Sales Role";
  return null;
}

function moduleCodesEnabled(row: Json): string[] {
  const lines = Array.isArray(row.modules) ? (row.modules as Json[]) : [];
  const names = lines
    .filter((line) => bool(line.enabled))
    .map((line) => canonicalModuleName(str(line.name)))
    .filter((name): name is string => Boolean(name));
  if (names.length) return names;
  const out: string[] = [];
  if (bool(row.module_inventory)) out.push("Inventory");
  if (bool(row.module_hr)) out.push("HR Module");
  if (bool(row.sales_role_enabled)) out.push("Sales Role");
  return out;
}

function mapTenantListItem(row: Json): TenantListItem {
  return {
    id: n(row.id),
    tinNumber: str(row.tin),
    hotelDisplayName: str(row.name),
    businessType: axisOf(row),
    accountStatus: status(row.account_status),
    subscriptionStatus: subscriptionStanding(row.billing_state, row.subscription_state),
    billingState: lower(row.billing_state),
    setupFeeApproved: bool(row.setup_approved),
    setupFeeETB: n(row.setup_fee),
    yearlyFeeETB: n(row.annual_fee),
    ownerUserName: str(row.owner_username),
    managerUsername: row.manager_username ? str(row.manager_username) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    billingHold: bool(row.billing_hold),
    isIllustrationTenant: bool(row.is_illustration),
    unreadFeedback: n(row.unread_chat),
    logoUrl: str(row.logo_url) || null,
    staffCount: n(row.staff_count),
    branchCount: n(row.branch_count),
    lotCount: n(row.lot_count),
    stockValueETB: n(row.stock_value),
    parentName: row.parent_name ? str(row.parent_name) : null,
    parentTin: row.parent_tin ? str(row.parent_tin) : null,
    isBranch: bool(row.is_branch),
    isMain: bool(row.is_main),
    daysToRenewal: row.days_to_renewal == null ? null : n(row.days_to_renewal),
    salesAgentId: row.sales_agent == null ? null : n(row.sales_agent),
    salesAgentName: row.sales_agent_name ? str(row.sales_agent_name) : null,
  };
}

function mapModuleLines(row: Json): TenantModuleLine[] {
  const lines = Array.isArray(row.modules) ? (row.modules as Json[]) : [];
  return lines.map((line) => ({
    code: str(line.code),
    name: str(line.name),
    alwaysOn: bool(line.always_on),
    enabled: bool(line.enabled),
    yearlyFeeETB: line.yearly_fee == null ? null : n(line.yearly_fee),
  }));
}

/** Sales agents sign in with the tenant's shared login, so their account row
 *  carries a generated `agent-<timestamp>` username that must never be shown. */
export function isInternalLogin(value: string) {
  return /^agent-[\w.~-]+$/i.test(String(value || "").trim());
}

export function staffDisplayName(
  name: string | null | undefined,
  username: string,
  role?: string,
) {
  const pretty = String(name || "").trim();
  if (pretty && !isInternalLogin(pretty)) return pretty;
  if (isInternalLogin(username)) {
    return String(role || "").toUpperCase() === "SALES"
      ? "Sales agent"
      : "Generated login";
  }
  return username;
}

function mapStaffRow(row: Json): TenantUserRow {
  return {
    id: n(row.id),
    UserName: str(row.username),
    displayName: staffDisplayName(str(row.name), str(row.username), str(row.role)),
    Role: str(row.role),
    loginDisabled: bool(row.login_disabled),
    loginDisabledReason: row.login_disabled_reason ? str(row.login_disabled_reason) : null,
    createdAt: str(row.created_at ?? row.last_login ?? ""),
  };
}

function mapSubscriptionRow(row: Json): TenantPaymentRow & { tenantId: number; tinNumber: string } {
  return {
    id: n(row.id),
    tenantId: n(row.tenant_id ?? row.tenant),
    tinNumber: str(row.tin),
    paymentKind: "yearly",
    amountETB: n(row.amount),
    status: reviewStatus(row.status),
    transactionRef: str(row.transaction_ref || row.transaction_id),
    submittedAt: str(row.submitted_at ?? row.paid_on ?? row.created_at ?? ""),
    years: n(row.years),
  };
}

function mapSetupRow(row: Json): TenantPaymentRow & { tenantId: number; tinNumber: string } {
  return {
    id: n(row.id),
    tenantId: n(row.tenant_id ?? row.tenant),
    tinNumber: str(row.tin),
    paymentKind: "setup",
    amountETB: n(row.amount),
    status: reviewStatus(row.status),
    transactionRef: str(row.transaction_ref),
    submittedAt: str(row.submitted_at ?? row.created_at ?? ""),
  };
}

function mapTenantDetail(
  row: Json,
  staff: Json[],
  payments: TenantPaymentRow[],
): TenantDetail {
  const counts = (row.counts ?? {}) as Json;
  const chat = (row.chat ?? {}) as Json;
  const lines = mapModuleLines(row);
  const suggested = n(row.suggested_annual_fee);
  const current = n(row.annual_fee);
  return {
    id: n(row.id),
    tinNumber: str(row.tin),
    hotelDisplayName: str(row.name),
    businessType: axisOf(row),
    parentName: row.parent_name ? str(row.parent_name) : null,
    parentTin: row.parent_tin ? str(row.parent_tin) : null,
    isBranch: bool(row.is_branch),
    isMain: bool(row.is_main),
    isRoot: bool(row.is_root ?? !row.is_branch),
    family: (Array.isArray(row.family) ? (row.family as Json[]) : []).map((member) => ({
      id: n(member.id),
      tinNumber: str(member.tin),
      name: str(member.name),
      isMain: bool(member.is_main),
      isRoot: bool(member.is_root),
      logoUrl: member.logo_url ? str(member.logo_url) : null,
    })),
    logoUrl: row.logo_url ? str(row.logo_url) : null,
    accountStatus: status(row.account_status),
    subscriptionStatus: subscriptionStanding(row.billing_state, row.subscription_state),
    billingState: lower(row.billing_state),
    modules: moduleCodesEnabled(row),
    moduleLines: lines,
    setupFeeETB: n(row.setup_fee),
    yearlyFeeETB: current,
    suggestedSetupFeeETB: n(row.suggested_setup_fee),
    suggestedYearlyFeeETB: suggested,
    feesManuallySet: bool(row.fees_manually_set),
    feesMatchCatalog:
      (!bool(row.fees_manually_set) || current === suggested) &&
      n(row.setup_fee) === n(row.suggested_setup_fee),
    setupFeeApproved: bool(row.setup_approved),
    subscriptionPaymentApproved: upper(row.subscription_state) !== "UNPAID",
    subscriptionPaidUntil: row.subscription_expires_on ? str(row.subscription_expires_on) : null,
    paidYearsCount: n(row.paid_years ?? counts.payments),
    billingHold: bool(row.billing_hold),
    billingHoldNote: str(row.billing_hold_note),
    billingStartedAt: row.subscription_paid_on ? str(row.subscription_paid_on) : null,
    isIllustrationTenant: bool(row.is_illustration),
    freeTrialEndsAt: row.free_trial_ends_on ? str(row.free_trial_ends_on) : null,
    trialDaysLeft: row.trial_days_left == null ? null : n(row.trial_days_left),
    daysToRenewal: row.days_to_renewal == null ? null : n(row.days_to_renewal),
    nextRenewalDate: row.next_renewal_date ? str(row.next_renewal_date) : null,
    billingNotes: row.subscription_note ? str(row.subscription_note) : null,
    paymentChannel: null,
    paymentTransactionRef: str(row.subscription_transaction_id) || null,
    planName: row.plan ? str(row.plan) : null,
    ownerUserName: str(row.owner_username ?? ((row.owner ?? {}) as Json).username ?? ""),
    phone: str(row.phone),
    address: str(row.address),
    vatRate: n(row.vat_rate),
    suspendedReason: str(row.suspended_reason) || null,
    bannedReason: str(row.banned_reason) || null,
    deletedReason: str(row.deleted_reason) || null,
    users: staff.map(mapStaffRow),
    recentPayments: payments,
    operationalSnapshot: {
      staffCount: n(counts.staff),
      branchCount: n(counts.branches),
      lotCount: n(counts.lots),
      stockValueETB: n(row.stock_value),
      paymentsCount: n(counts.payments),
      setupPaymentsCount: n(counts.setup_payments),
    },
    chat: {
      threadId: chat.thread == null ? null : n(chat.thread),
      status: chat.status ? status(chat.status) : null,
      subject: str(chat.subject),
      unreadFromTenant: n(chat.unread_for_apex),
      messages: n(chat.messages),
    },
    salesRoleEnabled: bool(row.sales_role_enabled),
    salesAgentId: row.sales_agent == null ? null : n(row.sales_agent),
    salesAgentName: row.sales_agent_name ? str(row.sales_agent_name) : null,
  };
}

function mapPaymentRow(row: Json, kind: string): PaymentRow {
  const base = kind === "setup" ? mapSetupRow(row) : mapSubscriptionRow(row);
  return {
    id: base.id,
    tenantId: base.tenantId,
    tinNumber: base.tinNumber,
    paymentKind: kind,
    amountETB: base.amountETB,
    paymentChannel: str(row.channel),
    transactionRef: base.transactionRef,
    status: base.status,
    submittedAt: base.submittedAt,
    hotelDisplayName: str(row.tenant ?? row.hotelDisplayName ?? row.name) || null,
    years: base.years,
    salesAgentName: row.sales_agent_name ? str(row.sales_agent_name) : null,
  };
}

function mapSignupRow(row: Json): SignupPipelineRow & { status: SignupReviewStatus; id: number } {
  return {
    id: n(row.id),
    tinNumber: str(row.tin),
    hotelDisplayName: str(row.name),
    businessType: bool(row.is_branch) ? "Branch" : "Company",
    ownerUserName: str(row.owner_username),
    managerUsername: row.manager_username ? str(row.manager_username) : null,
    setupFeeETB: n(row.setup_amount),
    paymentTransactionRef: str(row.setup_ref) || null,
    paymentChannel: str(row.setup_channel) || null,
    registeredAt: str(row.created_at),
    pendingSetupPaymentId:
      reviewStatus(row.setup_status) === "pending" && row.setup_payment_id != null
        ? n(row.setup_payment_id)
        : null,
    status: reviewStatus(row.setup_status),
    salesAgentName: str(row.sales_agent) || null,
  };
}

function mapThreadRow(row: Json): FeedbackThreadRow {
  return {
    id: n(row.id),
    tenantId: n(row.tenant),
    tinNumber: str(row.tin),
    hotelDisplayName: str(row.tenant_name),
    status: status(row.status),
    unreadFromTenant: n(row.unread_for_apex),
    updatedAt: str(row.updated_at),
    lastMessage: row.last_message
      ? {
          body: str((row.last_message as Json).body),
          senderSide: lower((row.last_message as Json).side),
          createdAt: str((row.last_message as Json).created_at),
        }
      : null,
  };
}

function mapAuditRow(row: Json): AuditLogRow {
  const targetType = lower(row.target_type);
  const targetId = n(row.target_id);
  return {
    id: n(row.id),
    action: str(row.action),
    targetTinNumber: targetType === "tenant" && targetId ? String(targetId) : null,
    targetUserId: targetType === "user" || targetType === "profile" ? targetId : null,
    reason: str(row.reason) || null,
    apexMemberName: str(row.actor) || null,
    createdAt: str(row.at),
    category: str(row.category),
    detail: str(row.detail),
  };
}

function mapSalesAgent(row: Json): SalesAgentRow {
  return {
    id: n(row.id),
    displayName: str(row.name ?? row.displayName),
    phone: str(row.phone) || null,
    email: str(row.email) || null,
    city: str(row.city) || null,
    notes: str(row.notes) || null,
    isActive: row.active === undefined ? true : bool(row.active),
    createdAt: str(row.created_at),
    tenantCount: n(row.tenant_count ?? row.tenantCount),
  };
}

/** Sales pricing needs stock, so a Sales plan always carries Inventory. */
export function normalizePlanModules(modules: readonly string[]): string[] {
  const set = new Set(modules.map((m) => String(m).trim()).filter(Boolean));
  if (set.has("Sales Role")) set.add("Inventory");
  return APEX_SUBSCRIPTION_MODULES.filter((m) => set.has(m));
}

/** The catalog keys plans by module set, so the plan name is derived, never typed. */
export function planNameFromModules(modules: readonly string[]): string {
  const set = normalizePlanModules(modules);
  if (set.length === 0) return "Base package";
  if (set.length === 1) return set[0];
  const key = set.join(" + ");
  if (key === "Inventory + HR Module") return "Standard plan";
  if (key === "Inventory + Sales Role") return "Basic plan";
  if (key === "Inventory + HR Module + Sales Role") return "Complete plan";
  return key;
}

export function modulesFromPlanName(name: string): string[] | null {
  const value = String(name || "").trim();
  if (!value) return null;
  if (value === "Base package") return [];
  if (value === "Standard plan") return ["Inventory", "HR Module"];
  if (value === "Basic plan") return ["Inventory", "Sales Role"];
  if (value === "Complete plan") return ["Inventory", "HR Module", "Sales Role"];
  const known = value
    .split("+")
    .map((part) => part.trim())
    .filter((part) => (APEX_SUBSCRIPTION_MODULES as readonly string[]).includes(part));
  return known.length > 0 ? known : null;
}

/** Mirrors BackEnd/tenants/pricing.py suggest_fees for a draft module mix. */
export function suggestFeesForModules(
  rules: PricingRuleRow[],
  modules: readonly string[],
): {
  planName: string;
  setupFeeETB: number;
  yearlyFeeETB: number;
  exact: boolean;
} | null {
  const wanted = new Set(
    modules
      .map((m) => canonicalModuleName(m))
      .filter((name): name is string => Boolean(name)),
  );
  const active = rules.filter((r) => r.isActive);
  const exact = active.find((r) => {
    const plan = new Set(r.modules);
    return plan.size === wanted.size && [...wanted].every((m) => plan.has(m));
  });
  if (exact) {
    return {
      planName: exact.modulesKey,
      setupFeeETB: exact.setupFeeETB,
      yearlyFeeETB: exact.yearlyFeeETB,
      exact: true,
    };
  }
  const base = active.find((r) => r.isDefault) ?? active[0];
  if (!base) return null;
  let yearly = base.yearlyFeeETB;
  if (wanted.has("Inventory")) yearly += base.inventoryYearlyFeeETB ?? 0;
  if (wanted.has("HR Module")) yearly += base.hrYearlyFeeETB ?? 0;
  if (wanted.has("Sales Role")) yearly += base.salesRoleYearlyFeeETB ?? 0;
  return {
    planName: base.modulesKey,
    setupFeeETB: base.setupFeeETB,
    yearlyFeeETB: yearly,
    exact: false,
  };
}

function mapPricingRule(row: Json): PricingRuleRow {
  const feeModules: string[] = [];
  if (n(row.inventory_yearly_fee) > 0) feeModules.push("Inventory");
  if (n(row.hr_yearly_fee) > 0) feeModules.push("HR Module");
  if (n(row.sales_role_yearly_fee) > 0) feeModules.push("Sales Role");
  const modules = modulesFromPlanName(str(row.name)) ?? feeModules;
  return {
    id: n(row.id),
    businessType: "Company",
    modulesKey: str(row.name),
    modules,
    setupFeeETB: n(row.setup_fee),
    yearlyFeeETB: n(row.yearly_base_fee),
    description: str(row.description) || null,
    isActive: bool(row.active),
    sortOrder: bool(row.is_default) ? 0 : 1,
    updatedAt: str(row.created_at),
    inventoryYearlyFeeETB: n(row.inventory_yearly_fee),
    hrYearlyFeeETB: n(row.hr_yearly_fee),
    salesRoleYearlyFeeETB: n(row.sales_role_yearly_fee),
    isDefault: bool(row.is_default),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard + tenant reads                                           */
/* ------------------------------------------------------------------ */

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return dedupeApexRead("apex:summary", async () => {
    const row = await apexGet<Json>("/api/tenants/dashboard");
    const companies = n(row.companies);
    const branches = n(row.branches);
    return {
      pendingSetupPayments: n(row.pending_setup_payments),
      pendingYearlyPayments: n(row.pending_subscription_payments),
      unreadFeedback: n(row.unread_feedback),
      suspendedTenants: n(row.suspended),
      bannedTenants: n(row.banned),
      setupPendingTenants: n(row.pending_setup_payments),
      inactiveTenants: n(row.suspended) + n(row.banned) + n(row.deleted),
      billingHoldTenants: n(row.on_billing_hold),
      graceOrExpiredTenants: n(row.overdue),
      trialsEndingSoon: n(row.trial_ending),
      trialExpiredTenants: n(row.trial_expired),
      totalTenants: companies + branches,
      totalUsers: n(row.staff),
      disabledUsers: n(row.logins_disabled),
      tenantsByBusinessType: [
        { businessType: "Company", label: "Companies", count: companies },
        { businessType: "Branch", label: "Branches", count: branches },
      ],
    };
  });
}

export async function fetchTenants(search?: string, businessType?: string): Promise<TenantListItem[]> {
  const axis = businessType ? businessType.trim().toLowerCase() : "";
  const key = `apex:tenants:${(search || "").trim().toLowerCase()}:${axis || "all"}`;
  return dedupeApexRead(key, async () => {
    const params: Json = { search: (search || "").trim() || undefined, limit: 1000 };
    if (axis === "company") params.branch = "false";
    else if (axis === "branch") params.branch = "true";
    else if (axis === "deleted") params.access = "DELETED";
    else if (axis) params.access = upper(axis);
    const rows = await apexList<Json>("/api/tenants", params as Record<string, unknown>);
    return rows.rows.map(mapTenantListItem);
  });
}

export async function fetchTenantDetail(tinNumber: string): Promise<TenantDetail> {
  const key = `apex:tenant:${tinNumber}`;
  return dedupeApexRead(key, async () => {
    const id = await resolveTenantId(tinNumber);
    const [row, staff, payments] = await Promise.all([
      apexGet<Json>(`/api/tenants/${id}`),
      apexGet<Json[]>(`/api/tenants/${id}/staff`).catch(() => [] as Json[]),
      fetchTenantPaymentHistory(id),
    ]);
    return mapTenantDetail(row, Array.isArray(staff) ? staff : [], payments);
  });
}

export async function fetchPendingPayments(kind?: string): Promise<PaymentRow[]> {
  const key = `apex:payments:${kind || "all"}`;
  return dedupeApexRead(key, async () => {
    const wanted = lower(kind || "all");
    const tasks: Promise<PaymentRow[]>[] = [];
    if (wanted === "all" || wanted === "setup") {
      tasks.push(
        apexList<Json>("/api/tenants/setup-payments", { status: "PENDING", limit: 500 })
          .then((page) => page.rows.map((row) => mapPaymentRow(row, "setup")))
          .catch(() => [] as PaymentRow[]),
      );
    }
    if (wanted === "all" || wanted === "yearly") {
      tasks.push(
        apexList<Json>("/api/tenants/subscriptions", { status: "PENDING", limit: 500 })
          .then((page) => page.rows.map((row) => mapPaymentRow(row, "yearly")))
          .catch(() => [] as PaymentRow[]),
      );
    }
    const groups = await Promise.all(tasks);
    return groups
      .flat()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  });
}

/** Everything already decided for one wholesaler, newest first. */
export async function fetchTenantPaymentHistory(
  tenant: string | number,
  limit = 50,
): Promise<TenantPaymentRow[]> {
  const key = `apex:tenant-payments:${tenant}:${limit}`;
  return dedupeApexRead(key, async () => {
    const id = await resolveTenantId(tenant);
    const [subscriptions, setups] = await Promise.all([
      apexGet<Json[]>(`/api/tenants/${id}/payments`).catch(() => [] as Json[]),
      apexList<Json>("/api/tenants/setup-payments", { tenant: id, limit: 200 })
        .then((page) => page.rows)
        .catch(() => [] as Json[]),
    ]);
    const rows = [
      ...(Array.isArray(subscriptions) ? subscriptions : []).map((row) =>
        mapSubscriptionRow(row),
      ),
      ...setups.map((row) => mapSetupRow(row)),
    ];
    return rows
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, limit);
  });
}

/* ------------------------------------------------------------------ */
/* Payment decisions                                                  */
/* ------------------------------------------------------------------ */

/** The TIN-named queue endpoint needs the submission's own pk. */
async function pendingSubmissionId(kind: "setup" | "yearly", tinNumber: string): Promise<number> {
  const rows = await fetchPendingPayments(kind);
  const wanted = String(tinNumber).trim().toLowerCase();
  const match =
    rows.find((row) => row.tinNumber.toLowerCase() === wanted) ??
    rows.find((row) => String(row.tenantId) === wanted);
  if (!match) throw new Error(`No pending ${kind} payment for ${tinNumber}.`);
  return match.id;
}

export async function approveSetup(tinNumber: string) {
  const id = await pendingSubmissionId("setup", tinNumber);
  await apexPatch("/api/tenants/setup-payments", { id, status: "APPROVED", note: "" });
  afterPaymentMutation();
}

export async function rejectSetup(tinNumber: string, reason: string) {
  const id = await pendingSubmissionId("setup", tinNumber);
  await apexPatch("/api/tenants/setup-payments", {
    id,
    status: "REJECTED",
    note: reason.trim(),
  });
  afterPaymentMutation();
}

export async function approveYearly(tinNumber: string) {
  const id = await pendingSubmissionId("yearly", tinNumber);
  await apexPatch(`/api/payments/subscription/${id}/decision`, { decision: "APPROVED", note: "" });
  afterPaymentMutation();
}

export async function rejectSetupPayment(submissionId: number, reason: string) {
  const note = reason.trim();
  if (note.length < 4) throw new Error("Explain the rejection — the wholesaler sees it.");
  await apexPatch("/api/tenants/setup-payments", {
    id: submissionId,
    status: "REJECTED",
    note,
  });
  afterPaymentMutation();
}

export async function rejectPayment(submissionId: number, reason: string) {
  const note = reason.trim();
  if (!note) throw new Error("Rejection reason is required");
  await apexPatch(`/api/payments/subscription/${submissionId}/decision`, {
    decision: "REJECTED",
    note,
  });
  afterPaymentMutation();
}

export async function releaseHold(tinNumber: string) {
  const id = await resolveTenantId(tinNumber);
  await apexPatch(`/api/tenants/${id}/billing`, { billing_hold: false });
  afterBillingMutation();
}

/* ------------------------------------------------------------------ */
/* Access control                                                     */
/* ------------------------------------------------------------------ */

async function runAccessAction(
  tinNumber: string,
  action: "suspend" | "unsuspend" | "ban" | "unban" | "delete" | "restore",
  reason?: string,
) {
  const id = await resolveTenantId(tinNumber);
  await apexPost(`/api/tenants/${id}/access`, {
    action,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
  afterTenantAccountMutation();
}

export const suspendTenant = (tinNumber: string, reason: string) =>
  runAccessAction(tinNumber, "suspend", reason);
export const unsuspendTenant = (tinNumber: string) => runAccessAction(tinNumber, "unsuspend");
export const banTenant = (tinNumber: string, reason: string) =>
  runAccessAction(tinNumber, "ban", reason);
export const unbanTenant = (tinNumber: string) => runAccessAction(tinNumber, "unban");
export const deleteTenant = (tinNumber: string, reason: string) =>
  runAccessAction(tinNumber, "delete", reason);
export const restoreDeletedTenant = (tinNumber: string, reason?: string) =>
  runAccessAction(tinNumber, "restore", reason);

export async function setUserLoginDisabled(userId: number, disabled: boolean, reason?: string) {
  await apexPost(`/api/tenants/staff/${userId}/login`, { disabled, reason: reason || "" });
  afterUserMutation();
}

/* ------------------------------------------------------------------ */
/* Chat — one thread per wholesaler, addressed by tenant id            */
/* ------------------------------------------------------------------ */

export async function fetchFeedbackThreads(limit = 500): Promise<FeedbackThreadRow[]> {
  const key = `apex:feedback:${limit}`;
  return dedupeApexRead(key, async () => {
    const page = await apexList<Json>("/api/chat/threads", { limit });
    return page.rows.map(mapThreadRow);
  });
}

export async function fetchFeedbackDirectory(search?: string): Promise<FeedbackDirectoryRow[]> {
  const key = `apex:feedback-dir:${(search || "").trim().toLowerCase()}`;
  return dedupeApexRead(key, async () => {
    const [tenants, threads] = await Promise.all([
      fetchTenants(search?.trim() || undefined),
      fetchFeedbackThreads(),
    ]);
    const byTenant = new Map(threads.map((thread) => [thread.tenantId, thread]));
    return tenants.map((tenant) => {
      const thread = byTenant.get(tenant.id);
      return {
        tenantId: tenant.id,
        tinNumber: tenant.tinNumber,
        hotelDisplayName: tenant.hotelDisplayName,
        logoUrl: tenant.logoUrl ?? null,
        threadId: thread?.id ?? null,
        chatStatus: thread?.status ?? "none",
        unreadFromTenant: thread?.unreadFromTenant ?? 0,
        updatedAt: thread?.updatedAt ?? tenant.createdAt ?? null,
        lastMessage: thread?.lastMessage ?? null,
      };
    });
  });
}

async function tenantIdOfThread(threadId: number): Promise<number> {
  const threads = await fetchFeedbackThreads();
  const match = threads.find((thread) => thread.id === threadId);
  if (!match) throw new Error(`Chat thread ${threadId} not found.`);
  return match.tenantId;
}

export async function fetchFeedbackThread(threadId: number): Promise<FeedbackThreadDetail> {
  const tenantId = await tenantIdOfThread(threadId);
  const body = await apexGet<Json>(`/api/chat/threads/${tenantId}`);
  const thread = (body.thread ?? {}) as Json;
  const messages = Array.isArray(body.messages) ? (body.messages as Json[]) : [];
  return {
    id: n(thread.id ?? threadId),
    tenantId,
    tinNumber: str(thread.tin),
    hotelDisplayName: str(thread.tenant_name),
    status: status(thread.status),
    messages: messages.map((message) => ({
      id: n(message.id),
      senderSide: lower(message.side),
      tenantUserName: message.side === "TENANT" ? str(message.actor) : null,
      apexDisplayName: message.side === "APEX" ? str(message.actor) : null,
      body: str(message.body),
      imageUrl: str(message.image_url) || null,
      createdAt: str(message.created_at),
    })),
  };
}

export async function sendApexFeedback(threadId: number, body: string, imageUrl?: string) {
  const tenantId = await tenantIdOfThread(threadId);
  await apexPost(`/api/chat/threads/${tenantId}`, { body, image_url: imageUrl || "" });
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:summary");
}

export async function startApexChatWithTenant(tinNumber: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("Opening message is required");
  const tenantId = await resolveTenantId(tinNumber);
  const created = await apexPost<Json>("/api/chat/threads", {
    tenant: tenantId,
    body: text,
  });
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:summary");
  return { id: n((created?.thread as Json | undefined)?.id ?? created?.id), tenantId };
}

export type BroadcastChatResult = {
  sentCount: number;
  failedCount: number;
  threadIds: number[];
  failures: { tinNumber: string; message: string }[];
};

export async function broadcastApexChatToTenants(
  tinNumbers: string[],
  body: string,
): Promise<BroadcastChatResult> {
  const text = body.trim();
  if (!text) throw new Error("Broadcast message is required");
  const tins = [...new Set(tinNumbers.map((t) => t.trim()).filter(Boolean))];
  if (tins.length === 0) throw new Error("Select at least one wholesaler");

  const ids: number[] = [];
  const failures: { tinNumber: string; message: string }[] = [];
  for (const tin of tins) {
    try {
      ids.push(await resolveTenantId(tin));
    } catch (error) {
      failures.push({ tinNumber: tin, message: mapApexApiError(error, "Not found") });
    }
  }
  if (!ids.length) {
    return { sentCount: 0, failedCount: tins.length, threadIds: [], failures };
  }

  const result = await apexPost<Json>("/api/chat/broadcast", { tenant_ids: ids, body: text });
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:summary");
  const errors = Array.isArray(result.errors) ? (result.errors as Json[]) : [];
  return {
    sentCount: n(result.delivered),
    failedCount: n(result.failed) + failures.length,
    threadIds: Array.isArray(result.rows)
      ? (result.rows as Json[]).map((row) => n(row.thread))
      : [],
    failures: [
      ...failures,
      ...errors.map((row) => ({ tinNumber: str(row.tenant), message: str(row.message) })),
    ],
  };
}

export async function closeFeedbackThread(threadId: number, reason?: string) {
  const tenantId = await tenantIdOfThread(threadId);
  await apexPatch(`/api/chat/threads/${tenantId}`, { action: "close", reason: reason || "" });
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:summary");
}

export async function fetchFeedbackTenantContext(tinNumber: string) {
  return fetchTenantDetail(tinNumber);
}

/* ------------------------------------------------------------------ */
/* Users, audit, modules, signups                                     */
/* ------------------------------------------------------------------ */

export async function fetchTenantUsers(
  search?: string,
  businessType?: string,
  options?: { loginDisabledOnly?: boolean; limit?: number },
): Promise<TenantUserMonitoringRow[]> {
  const axis = businessType ? businessType.trim().toLowerCase() : "";
  const disabledOnly = Boolean(options?.loginDisabledOnly);
  const limit = options?.limit ?? 500;
  const key = `apex:users:${(search || "").trim().toLowerCase()}:${axis || "all"}:${disabledOnly}:${limit}`;
  return dedupeApexRead(key, async () => {
    const page = await apexList<Json>("/api/tenants/staff", {
      search: (search || "").trim() || undefined,
      disabled: disabledOnly || undefined,
      limit,
    });
    const rows = page.rows.map((row): TenantUserMonitoringRow => {
      const isBranch = bool(row.is_branch);
      return {
        id: n(row.id),
        userName: str(row.username),
        displayName: staffDisplayName(str(row.name), str(row.username), str(row.role)),
        role: str(row.role),
        tinNumber: str(row.tin),
        hotelDisplayName: str(row.tenant),
        businessType: isBranch ? "Branch" : "Company",
        loginDisabled: bool(row.login_disabled),
        loginDisabledReason: str(row.login_disabled_reason) || null,
        createdAt: row.created_at ? str(row.created_at) : null,
      };
    });
    const filtered = axis
      ? rows.filter((row) =>
          axis === "company"
            ? row.businessType === "Company"
            : axis === "branch"
              ? row.businessType === "Branch"
              : true,
        )
      : rows;
    return filtered.slice(0, limit);
  });
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const key = `apex:audit:${limit}`;
  return dedupeApexRead(key, async () => {
    const page = await apexList<Json>("/api/tenants/audit", { limit });
    const rows = page.rows.map(mapAuditRow);
    // `target_id` is the pk; the table shows TINs, so translate in one pass.
    const index = await tenantIndex().catch(() => [] as TenantRef[]);
    const byId = new Map(index.map((ref) => [ref.id, ref.tinNumber]));
    return rows.map((row) => ({
      ...row,
      targetTinNumber: row.targetTinNumber
        ? byId.get(Number(row.targetTinNumber)) ?? null
        : null,
    }));
  });
}

export async function fetchSignupPipeline(limit = 50): Promise<SignupPipelineRow[]> {
  const key = `apex:signups:${limit}`;
  return dedupeApexRead(key, async () => {
    const rows = await fetchSignupRows({ months: 1, limit });
    return rows.map(({ status: _status, id: _id, ...rest }) => rest);
  });
}

async function fetchSignupRows(params: Record<string, unknown>): Promise<
  (SignupPipelineRow & { status: SignupReviewStatus; id: number })[]
> {
  const page = await apexList<Json>("/api/tenants/signups", params);
  return page.rows.map(mapSignupRow);
}

/**
 * Signups for the current calendar month (pending, approved and rejected).
 * The Django signups endpoint already joins the latest setup submission, so
 * one read gives the whole review board.
 */
export async function fetchMonthlySignups(): Promise<MonthlySignupRow[]> {
  const now = new Date();
  const key = `apex:signups:month:${now.getFullYear()}-${now.getMonth()}`;
  return dedupeApexRead(key, async () => {
    const rows = await fetchSignupRows({ months: 1, limit: 500 });
    return rows
      .map((row) => ({ ...row, subscriptionStatus: "active" }))
      .sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
      );
  });
}

/* ------------------------------------------------------------------ */
/* Billing, modules, pricing                                          */
/* ------------------------------------------------------------------ */

/** The billing endpoint counts days from today; the console picks a calendar date. */
function trialDaysFromToday(value: string): number {
  const end = new Date(value);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (days < 1 || days > 90) {
    throw new Error("A free trial ends 1 to 90 days from today.");
  }
  return days;
}

export async function updateTenantBilling(tinNumber: string, input: TenantBillingInput) {
  const id = await resolveTenantId(tinNumber);
  const patch: Json = {};
  if (input.isIllustrationTenant !== undefined) patch.is_illustration = input.isIllustrationTenant;
  if (input.billingHold !== undefined) {
    patch.billing_hold = input.billingHold;
    if (input.billingHold) patch.billing_hold_note = input.billingHoldNote ?? input.billingNotes ?? "";
  }
  if (input.yearlyFeeETB !== undefined) patch.annual_fee = input.yearlyFeeETB;
  if (input.setupFeeETB !== undefined) patch.setup_fee = input.setupFeeETB;
  if (input.freeTrialEndsAt !== undefined) {
    patch.free_trial_days = input.freeTrialEndsAt
      ? trialDaysFromToday(input.freeTrialEndsAt)
      : null;
  }
  if (Object.keys(patch).length) {
    await apexPatch(`/api/tenants/${id}/billing`, patch);
  }
  if (input.billingNotes !== undefined) {
    await apexPatch(`/api/tenants/${id}`, { subscription_note: input.billingNotes ?? "" });
  }
  afterBillingMutation();
}

/** Module display names ↔ the three switches the Django model stores. */
function modulePatch(modules: string[]): Json {
  const wanted = new Set(
    modules
      .map((m) => canonicalModuleName(m))
      .filter((name): name is string => Boolean(name)),
  );
  return {
    module_inventory: wanted.has("Inventory"),
    module_hr: wanted.has("HR Module"),
    sales_role_enabled: wanted.has("Sales Role"),
  };
}

export async function updateTenantModules(
  tinNumber: string,
  modules: string[],
  recalcFees?: boolean,
) {
  const id = await resolveTenantId(tinNumber);
  await apexPatch(`/api/tenants/${id}/modules`, {
    ...modulePatch(modules),
    apply_fee: recalcFees ?? false,
  });
  afterModuleMutation();
}

export async function applySuggestedTenantFees(tinNumber: string) {
  const id = await resolveTenantId(tinNumber);
  await apexPatch(`/api/tenants/${id}/billing`, { apply_fee: true });
  afterBillingMutation();
}

export async function syncTenantStaffModules(tinNumber: string) {
  const id = await resolveTenantId(tinNumber);
  await apexPatch(`/api/tenants/${id}/modules`, { sync_branches: true });
  afterModuleMutation();
}

export async function fetchPricingRules(): Promise<PricingRuleRow[]> {
  return dedupeApexRead("apex:pricing:all", async () => {
    const rows = await apexGet<Json[]>("/api/pricing");
    return (Array.isArray(rows) ? rows : []).map(mapPricingRule);
  });
}

export async function upsertPricingRule(input: PricingRuleInput): Promise<PricingRuleRow> {
  const body: Json = {
    name: planNameFromModules(input.modules),
    setup_fee: input.setupFeeETB,
    yearly_base_fee: input.yearlyFeeETB,
    inventory_yearly_fee: input.inventoryYearlyFeeETB ?? 0,
    hr_yearly_fee: input.hrYearlyFeeETB ?? 0,
    sales_role_yearly_fee: input.salesRoleYearlyFeeETB ?? 0,
    description: input.description ?? "",
    active: input.isActive ?? true,
  };
  const saved = input.id
    ? await apexPatch<Json>(`/api/pricing/${input.id}`, body)
    : await apexPost<Json>("/api/pricing", body);
  afterPricingMutation();
  return mapPricingRule(saved);
}

export async function setPricingRuleActive(id: number, isActive: boolean) {
  await apexPatch(`/api/pricing/${id}`, { active: isActive });
  afterPricingMutation();
}

export async function deletePricingRule(id: number) {
  await apexDelete(`/api/pricing/${id}`);
  afterPricingMutation();
}

export async function fetchSignupPricingPreview(
  _businessType: string,
  modules: string[],
): Promise<SignupPricingPreview> {
  const data = await apexPost<Json>("/api/pricing/preview", modulePatch(modules));
  return {
    setupFeeETB: n(data.setup_fee),
    yearlyFeeETB: n(data.total_annual_fee),
    source: str((data.plan as Json)?.name ?? "Default plan"),
  };
}

/** Replace wholesaler logo only — does not change name, TIN, or business type. */
export async function updateTenantLogo(tinNumber: string, logoUrl: string) {
  const id = await resolveTenantId(tinNumber);
  await apexPatch(`/api/tenants/${id}`, { logo_url: logoUrl });
  invalidateApexListCache();
}

/* ------------------------------------------------------------------ */
/* Sales agents                                                       */
/* ------------------------------------------------------------------ */

export async function fetchApexSalesAgents(activeOnly = false): Promise<SalesAgentRow[]> {
  const key = `apex:sales-agents:${activeOnly ? "active" : "all"}`;
  return dedupeApexRead(key, async () => {
    const rows = await apexGet<Json[]>("/api/sales-agents");
    const mapped = (Array.isArray(rows) ? rows : []).map(mapSalesAgent);
    return activeOnly ? mapped.filter((row) => row.isActive) : mapped;
  });
}

export async function fetchPublicSalesAgents(): Promise<SalesAgentRow[]> {
  return fetchApexSalesAgents(true);
}

export async function upsertSalesAgent(input: {
  id?: number;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive?: boolean;
}): Promise<SalesAgentRow> {
  const body: Json = {
    name: input.displayName.trim(),
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    city: input.city?.trim() || "",
    notes: input.notes?.trim() || "",
    active: input.isActive ?? true,
  };
  const saved = input.id
    ? await apexPatch<Json>(`/api/sales-agents/${input.id}`, body)
    : await apexPost<Json>("/api/sales-agents", body);
  invalidateApexCaches("apex:sales-agents");
  return mapSalesAgent(saved);
}

export async function setSalesAgentActive(id: number, isActive: boolean) {
  await apexPatch(`/api/sales-agents/${id}`, { active: isActive });
  invalidateApexCaches("apex:sales-agents");
}

export async function deleteSalesAgent(id: number) {
  await apexDelete(`/api/sales-agents/${id}?detach=true`);
  invalidateApexCaches("apex:sales-agents");
  invalidateApexCaches("apex:tenants");
}

/* ------------------------------------------------------------------ */
/* Onboarding                                                         */
/* ------------------------------------------------------------------ */

export async function fetchTenantsWithoutOwner(): Promise<TenantWithoutOwnerRow[]> {
  const page = await apexList<Json>("/api/tenants/without-owner", { limit: 500 });
  return page.rows.map((row) => ({
    id: n(row.id),
    tinNumber: str(row.tin),
    hotelDisplayName: str(row.name),
    businessType: bool(row.is_branch) ? "Branch" : "Company",
    hasStaffUsers: n(row.staff_count) > 0,
  }));
}

export async function fetchOwnerAccounts(search?: string): Promise<OwnerAccountRow[]> {
  const page = await apexList<Json>("/api/tenants/staff", {
    role: "OWNER",
    search: search?.trim() || undefined,
    limit: 500,
  });
  return page.rows.map((row) => ({
    id: n(row.id),
    userName: str(row.username),
    displayName: str(row.name) || null,
    phone: str(row.phone) || null,
    email: null,
    isActive: !bool(row.login_disabled) && bool(row.is_active),
    propertyCount: 1,
    createdAt: str(row.created_at ?? row.last_login ?? ""),
  }));
}

function moduleFlagsFromNames(modules: string[]): Json {
  return modulePatch(modules);
}

export async function apexCreateTenant(
  input: ApexCreateTenantInput,
): Promise<TenantOnboardingResult> {
  const body = await apexPost<{ data: Json; manager?: string }>("/api/tenants", {
    name: input.businessName,
    tin: input.tinNumber?.trim() || "",
    username: input.userName,
    password: input.password,
    logo_url: input.logoUrl ?? "",
    sales_agent: input.salesAgentId ?? null,
    ...moduleFlagsFromNames(input.modules),
  });
  const created = (body?.data ?? {}) as Json;
  afterOnboardingMutation();
  return {
    id: n(created.id),
    tinNumber: str(created.tin),
    hotelDisplayName: str(created.name),
    ownerUserName: input.userName,
    ownerRole: "OWNER",
    setupFeeETB: n(created.setup_fee),
    setupFeeApproved: Boolean(input.confirmPaymentReceived),
    userId: n((created.owner as Json | undefined)?.id ?? created.user_id),
  };
}

export async function apexCreateTenantOwner(
  input: ApexCreateTenantOwnerInput,
): Promise<TenantOnboardingResult> {
  const id = await resolveTenantId(input.tinNumber);
  const owner = await apexPost<Json>(`/api/tenants/${id}/owner`, {
    username: input.userName,
    password: input.password,
  });
  const detail = await apexGet<Json>(`/api/tenants/${id}`).catch(() => ({}) as Json);
  afterOnboardingMutation();
  return {
    id,
    tinNumber: str(detail.tin) || input.tinNumber,
    hotelDisplayName: str(detail.name),
    ownerUserName: str(owner.username ?? input.userName),
    ownerRole: "OWNER",
    setupFeeETB: n(detail.setup_fee),
    setupFeeApproved: Boolean(input.confirmPaymentReceived),
    userId: n(owner.id),
  };
}

export async function apexCreateOwnerAccount(
  input: ApexCreateOwnerAccountInput,
): Promise<OwnerAccountRow> {
  if (!input.linkTinNumber?.trim()) {
    throw new Error("Choose the wholesaler this owner signs into.");
  }
  const id = await resolveTenantId(input.linkTinNumber);
  const created = await apexPost<Json>(`/api/tenants/${id}/owner`, {
    username: input.userName,
    password: input.password,
    email: input.email ?? "",
  });
  afterOnboardingMutation();
  return {
    id: n(created.id),
    userName: str(created.username ?? input.userName),
    displayName: input.displayName ?? null,
    phone: input.phone ?? null,
    email: str(created.email) || null,
    isActive: true,
    propertyCount: 1,
    createdAt: str(created.created_at ?? ""),
  };
}

export async function apexLinkOwnerProperty(
  ownerAccountId: number,
  tinNumber: string,
  _label?: string | null,
) {
  const id = await resolveTenantId(tinNumber);
  await apexPost(`/api/tenants/${id}/owner/link`, { user_id: ownerAccountId, replace: false });
  afterOnboardingMutation();
}

export type PortfolioOwnerRow = {
  id: number;
  userName: string;
  displayName: string;
  email: string;
  lastLogin: string;
  mustChangePassword: boolean;
};

function portfolioOwnerFromJson(row: Json): PortfolioOwnerRow {
  return {
    id: n(row.id),
    userName: str(row.username),
    displayName: str(row.name) || str(row.username),
    email: str(row.email),
    lastLogin: str(row.last_login),
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export async function fetchPortfolioOwner(
  tinNumber: string,
): Promise<PortfolioOwnerRow | null> {
  const id = await resolveTenantId(tinNumber);
  const data = await apexGet<Json | null>(`/api/tenants/${id}/owner`);
  return data ? portfolioOwnerFromJson(data) : null;
}

export async function updatePortfolioOwner(
  tinNumber: string,
  patch: { userName: string; email: string; password?: string },
): Promise<PortfolioOwnerRow> {
  const id = await resolveTenantId(tinNumber);
  const updated = await apexPatch<Json>(`/api/tenants/${id}/owner`, {
    username: patch.userName.trim(),
    email: patch.email.trim(),
  });
  if (patch.password?.trim()) {
    await apexPost(`/api/tenants/staff/${n(updated.id)}/reset-password`, {
      password: patch.password.trim(),
    });
  }
  afterOnboardingMutation();
  return portfolioOwnerFromJson(updated);
}

export async function deletePortfolioOwner(tinNumber: string) {
  const id = await resolveTenantId(tinNumber);
  await apexDelete(`/api/tenants/${id}/owner`);
  afterOnboardingMutation();
}

export { mapApexApiError };

/* ------------------------------------------------------------------ */
/* Branches — child tenants of one company                             */
/* ------------------------------------------------------------------ */

export type TenantBranchItem = {
  id: number;
  tinNumber: string;
  name: string;
  isMain: boolean;
  staffCount: number;
  accountStatus: string;
  moduleInventory: boolean;
  moduleHr: boolean;
  salesRoleEnabled: boolean;
  yearlyFeeETB: number;
  setupFeeETB: number;
};

export async function fetchTenantBranches(
  tenantId: number,
): Promise<TenantBranchItem[]> {
  const rows = await apexGet<Json[]>(`/api/tenants/${tenantId}/branches/`);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: n(row.id),
    tinNumber: str(row.tin),
    name: str(row.name),
    isMain: bool(row.is_main),
    staffCount: n(row.staff_count),
    accountStatus: status(row.account_status),
    moduleInventory: bool(row.module_inventory),
    moduleHr: bool(row.module_hr),
    salesRoleEnabled: bool(row.sales_role_enabled),
    yearlyFeeETB: n(row.annual_fee),
    setupFeeETB: n(row.setup_fee),
  }));
}

export type TenantBranchDraft = {
  name: string;
  tin: string;
  phone?: string;
  address?: string;
  username?: string;
  password?: string;
  module_inventory?: boolean;
  module_hr?: boolean;
  sales_role_enabled?: boolean;
};

export async function createTenantBranch(
  tenantId: number,
  draft: TenantBranchDraft,
): Promise<string> {
  const created = await apexPost<Json>(
    `/api/tenants/${tenantId}/branches/`,
    draft,
  );
  invalidateApexCaches();
  return str(created.tin);
}

export async function deleteTenantBranch(branchId: number): Promise<void> {
  await apexDelete(`/api/tenants/${branchId}/`);
  invalidateApexCaches();
}

/* ------------------------------------------------------------------ */
/* Owner-filed branch requests + multi-branch yearly payments         */
/* ------------------------------------------------------------------ */

export type BranchRequestRow = {
  id: number;
  parentId: number;
  parentName: string;
  parentTin: string;
  name: string;
  tinNumber: string;
  phone: string;
  address: string;
  vatRate: number;
  moduleInventory: boolean;
  moduleHr: boolean;
  salesRoleEnabled: boolean;
  makeMain: boolean;
  managerName: string;
  managerUsername: string;
  setupChannel: string;
  setupTransactionRef: string;
  setupAmountETB: number;
  status: string;
  note: string;
  decisionNote: string;
  createdBy: string;
  createdAt: string | null;
  decidedBy: string;
  decidedAt: string | null;
  createdBranchTin: string | null;
};

function mapBranchRequest(row: Json): BranchRequestRow {
  return {
    id: n(row.id),
    parentId: n(row.parent),
    parentName: str(row.parent_name),
    parentTin: str(row.parent_tin),
    name: str(row.name),
    tinNumber: str(row.tin),
    phone: str(row.phone),
    address: str(row.address),
    vatRate: n(row.vat_rate),
    moduleInventory: bool(row.module_inventory),
    moduleHr: bool(row.module_hr),
    salesRoleEnabled: bool(row.sales_role_enabled),
    makeMain: bool(row.make_main),
    managerName: str(row.manager_name),
    managerUsername: str(row.manager_username),
    setupChannel: str(row.setup_channel),
    setupTransactionRef: str(row.setup_transaction_ref),
    setupAmountETB: n(row.setup_amount),
    status: status(row.status),
    note: str(row.note),
    decisionNote: str(row.decision_note),
    createdBy: str(row.created_by),
    createdAt: row.created_at ? String(row.created_at) : null,
    decidedBy: str(row.decided_by),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
    createdBranchTin: row.created_branch_tin ? str(row.created_branch_tin) : null,
  };
}

export async function fetchBranchRequests(options?: {
  status?: string;
  parentId?: number;
  search?: string;
}): Promise<BranchRequestRow[]> {
  const key = `apex:branch-requests:${options?.status || "all"}:${
    options?.parentId ?? "all"
  }:${(options?.search || "").trim().toLowerCase()}`;
  return dedupeApexRead(key, async () => {
    const page = await apexList<Json>("/api/tenants/branch-requests", {
      status: options?.status || undefined,
      parent: options?.parentId ?? undefined,
      search: (options?.search || "").trim() || undefined,
      limit: 200,
    });
    return page.rows.map(mapBranchRequest);
  });
}

export async function decideBranchRequest(
  id: number,
  decision: "APPROVED" | "REJECTED",
  note = "",
): Promise<BranchRequestRow> {
  const row = await apexPatch<Json>(`/api/tenants/branch-requests/${id}`, {
    decision,
    note,
  });
  invalidateApexCaches();
  return mapBranchRequest(row);
}

export type BranchPaymentLineRow = {
  lineId: number;
  tenantId: number;
  name: string;
  tinNumber: string;
  isMain: boolean;
  amountETB: number;
  years: number;
  status: string;
  coversUntil: string | null;
  approvedUntil: string | null;
  decisionNote: string;
};

export type BranchPaymentRow = {
  id: number;
  parentId: number;
  parentName: string;
  parentTin: string;
  transactionRef: string;
  channel: string;
  years: number;
  amountETB: number;
  approvedAmountETB: number;
  status: string;
  note: string;
  decisionNote: string;
  submittedBy: string;
  submittedAt: string | null;
  decidedBy: string;
  decidedAt: string | null;
  createdAt: string | null;
  branches: BranchPaymentLineRow[];
  includedCount: number;
  approvedCount: number;
};

function mapBranchPayment(row: Json): BranchPaymentRow {
  const lines = Array.isArray(row.branches) ? (row.branches as Json[]) : [];
  return {
    id: n(row.id),
    parentId: n(row.parent),
    parentName: str(row.parent_name),
    parentTin: str(row.parent_tin),
    transactionRef: str(row.transaction_ref),
    channel: str(row.channel),
    years: n(row.years),
    amountETB: n(row.amount),
    approvedAmountETB: n(row.approved_amount),
    status: status(row.status),
    note: str(row.note),
    decisionNote: str(row.decision_note),
    submittedBy: str(row.submitted_by),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    decidedBy: str(row.decided_by),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    branches: lines.map((line) => ({
      lineId: n(line.line_id),
      tenantId: n(line.tenant),
      name: str(line.name),
      tinNumber: str(line.tin),
      isMain: bool(line.is_main),
      amountETB: n(line.amount),
      years: n(line.years),
      status: status(line.status),
      coversUntil: line.covers_until ? String(line.covers_until) : null,
      approvedUntil: line.approved_until ? String(line.approved_until) : null,
      decisionNote: str(line.decision_note),
    })),
    includedCount: n(row.included_count),
    approvedCount: n(row.approved_count),
  };
}

export async function fetchBranchPayments(options?: {
  status?: string;
  parentId?: number;
  search?: string;
}): Promise<BranchPaymentRow[]> {
  const key = `apex:branch-payments:${options?.status || "all"}:${
    options?.parentId ?? "all"
  }:${(options?.search || "").trim().toLowerCase()}`;
  return dedupeApexRead(key, async () => {
    const page = await apexList<Json>("/api/tenants/branch-payments", {
      status: options?.status || undefined,
      parent: options?.parentId ?? undefined,
      search: (options?.search || "").trim() || undefined,
      limit: 200,
    });
    return page.rows.map(mapBranchPayment);
  });
}

export async function decideBranchPayment(
  id: number,
  decision: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED",
  options?: { excludedLineIds?: number[]; includedLineIds?: number[]; note?: string },
): Promise<BranchPaymentRow> {
  const row = await apexPatch<Json>(`/api/tenants/branch-payments/${id}`, {
    decision,
    excluded_line_ids: options?.excludedLineIds,
    included_line_ids: options?.includedLineIds,
    note: options?.note || "",
  });
  invalidateApexCaches();
  return mapBranchPayment(row);
}
