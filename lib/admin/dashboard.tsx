"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  dedupeApexRead,
  invalidateApexCaches,
  mapApiError,
  request,
} from "./core";
import { getApexToken } from "./session";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { CHART_COLORS } from "@/constants/apexPalette";

/* ------------------------------------------------------------------ */
/* Types (REST shapes from docs/api-additions.md)                       */
/* ------------------------------------------------------------------ */

export type DashboardSummary = {
  /** Platform stat grid — `GET /api/tenants/dashboard/` totals. */
  companies: number;
  branches: number;
  active: number;
  dueSoon: number;
  expired: number;
  yearRevenue: string;
  payments: number;
  stockValue: string;
  staff: number;
  /** Queue badges — polled every 60s for the sidebar/topbar pills. */
  pendingSetupPayments: number;
  pendingYearlyPayments: number;
  pendingModuleRequests: number;
  unreadFeedback: number;
  inactiveTenants: number;
};

export type TenantListItem = {
  id: number;
  name: string;
  tin: string;
  phone: string;
  address: string;
  logo_url: string;
  parent: number | null;
  is_main: boolean;
  is_branch: boolean;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  subscription_expires_on: string | null;
  subscription_transaction_id: string;
  subscription_state: string;
  sales_agent: number | null;
  sales_agent_name: string | null;
  annual_fee: string;
  created_at: string | null;
  staff_count: number;
  branch_count: number;
  lot_count: number;
  stock_value: string;
};

export type PlatformReportRow = {
  id: number;
  tenant: string;
  tin: string;
  is_branch: boolean;
  state: string;
  annual_fee: string;
  staff_count: number;
  lot_count: number;
  stock_value: string;
  payments_count: number;
};

export type PlatformReportTotals = {
  tenants: number;
  staff: number;
  lots: number;
  stock_value: string;
  annual_fee: string;
  payments: number;
};

export type PlatformReport = {
  rows: PlatformReportRow[];
  totals: PlatformReportTotals;
};

/* ------------------------------------------------------------------ */
/* Fetchers (cache-first, deduped — safe to call from many components)  */
/* ------------------------------------------------------------------ */

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const str = (value: unknown): string =>
  value == null ? "" : String(value);

/** Count PENDING rows in a queue list — fallback when the dashboard payload
 *  is served by an older backend without the `pending_*` fields. */
function countPending(rows: unknown): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter(
    (row) => String((row as Record<string, unknown>)?.status ?? "").toUpperCase() === "PENDING",
  ).length;
}

function countUnread(rows: unknown): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => Boolean((row as Record<string, unknown>)?.unread)).length;
}

/**
 * `GET /api/tenants/dashboard/` — platform totals plus the queue counts that
 * drive sidebar/topbar badges. When a backend predates the `pending_*` /
 * `unread_feedback` fields, they are derived client-side from the queue
 * list endpoints (`/setup-payments/`, `/subscriptions/`, `/module-requests/`,
 * `/feedback/`).
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return dedupeApexRead("vs:summary", async () => {
    const data = (await request<Record<string, unknown> | null>("/api/tenants/dashboard/")) ?? {};

    const companies = num(data.companies);
    const active = num(data.active);

    const hasQueueFields =
      "pending_setup_payments" in data ||
      "pending_subscription_payments" in data ||
      "pending_module_requests" in data ||
      "unread_feedback" in data;

    let pendingSetupPayments = num(data.pending_setup_payments);
    let pendingYearlyPayments = num(data.pending_subscription_payments);
    let pendingModuleRequests = num(data.pending_module_requests);
    let unreadFeedback = num(data.unread_feedback);

    if (!hasQueueFields) {
      const [setup, subscriptions, moduleRequests, feedback] = await Promise.all([
        request<unknown>("/api/tenants/setup-payments/").catch(() => null),
        request<unknown>("/api/tenants/subscriptions/").catch(() => null),
        request<unknown>("/api/tenants/module-requests/").catch(() => null),
        request<unknown>("/api/tenants/feedback/").catch(() => null),
      ]);
      pendingSetupPayments = countPending(setup);
      pendingYearlyPayments = countPending(subscriptions);
      pendingModuleRequests = countPending(moduleRequests);
      unreadFeedback = countUnread(feedback);
    }

    return {
      companies,
      branches: num(data.branches),
      active,
      dueSoon: num(data.due_soon),
      expired: num(data.expired),
      yearRevenue: str(data.year_revenue) || "0",
      payments: num(data.payments),
      stockValue: str(data.stock_value) || "0",
      staff: num(data.staff),
      pendingSetupPayments,
      pendingYearlyPayments,
      pendingModuleRequests,
      unreadFeedback,
      inactiveTenants: Math.max(0, companies - active),
    };
  });
}

/** `GET /api/tenants/` — every wholesaler and branch. */
export async function fetchTenants(): Promise<TenantListItem[]> {
  return dedupeApexRead("vs:tenants", async () => {
    const data = await request<TenantListItem[] | null>("/api/tenants/");
    return Array.isArray(data) ? data : [];
  });
}

/** `GET /api/reports/platform/` — per-tenant rows plus portfolio totals. */
export async function fetchPlatformReport(): Promise<PlatformReport> {
  return dedupeApexRead("vs:reports:platform", async () => {
    const data = await request<PlatformReport | null>("/api/reports/platform/");
    return {
      rows: Array.isArray(data?.rows) ? data.rows : [],
      totals: data?.totals ?? {
        tenants: 0,
        staff: 0,
        lots: 0,
        stock_value: "0",
        annual_fee: "0",
        payments: 0,
      },
    };
  });
}

/** Drop cached reads (call after any mutation so badges/queues re-sync). */
export function invalidateApexDashboardCaches(prefix?: string): void {
  invalidateApexCaches(prefix);
}

/* ------------------------------------------------------------------ */
/* Analytics                                                            */
/* ------------------------------------------------------------------ */

export type ChartSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type MonthlyGrowthPoint = {
  month: string;
  label: string;
  count: number;
  cumulative: number;
};

export type PortfolioInsight = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "success" | "info";
  href?: string;
  metric?: string;
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  DUE_SOON: "Due soon",
  EXPIRED: "Expired",
  UNPAID: "Never paid",
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  ACTIVE: CHART_COLORS.emerald,
  DUE_SOON: CHART_COLORS.amber,
  EXPIRED: CHART_COLORS.rose,
  UNPAID: CHART_COLORS.slate,
};

/** Donut slices from the tenants list — subscription state mix. */
export function aggregateSubscriptionStatus(tenants: TenantListItem[]): ChartSlice[] {
  const counts = new Map<string, number>();
  for (const t of tenants) {
    const key = String(t.subscription_state || "UNPAID").toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, value]) => ({
      key,
      label: SUBSCRIPTION_LABELS[key] ?? key,
      value,
      color: SUBSCRIPTION_COLORS[key] ?? CHART_COLORS.slate,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Modules-enabled breakdown (replaces hotcol's business-type breakdown). */
export function aggregateModulesEnabled(tenants: TenantListItem[]): ChartSlice[] {
  const rows: ChartSlice[] = [
    {
      key: "inventory",
      label: "Inventory",
      value: tenants.filter((t) => t.module_inventory).length,
      color: CHART_COLORS.emerald,
    },
    {
      key: "hr",
      label: "HR",
      value: tenants.filter((t) => t.module_hr).length,
      color: CHART_COLORS.teal,
    },
    {
      key: "sales",
      label: "Sales role",
      value: tenants.filter((t) => t.sales_role_enabled).length,
      color: CHART_COLORS.violet,
    },
    {
      key: "base",
      label: "Base plan only",
      value: tenants.filter(
        (t) => !t.module_inventory && !t.module_hr && !t.sales_role_enabled,
      ).length,
      color: CHART_COLORS.sky,
    },
  ];
  return rows.filter((r) => r.value > 0);
}

/** Monthly tenant growth (new + cumulative) from `created_at`. */
export function aggregateTenantGrowth(tenants: TenantListItem[]): MonthlyGrowthPoint[] {
  const byMonth = new Map<string, number>();
  for (const t of tenants) {
    if (!t.created_at) continue;
    const d = new Date(t.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  const sorted = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  return sorted.map(([month, count]) => {
    cumulative += count;
    const [y, m] = month.split("-");
    const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    return { month, label, count, cumulative };
  });
}

/** Top tenants by annual fee (from the platform report rows). */
export function topTenantsByAnnualFee(
  rows: PlatformReportRow[],
  limit = 7,
): { label: string; value: number; color: string }[] {
  return rows
    .filter((row) => !row.is_branch)
    .map((row) => ({
      label: row.tenant,
      value: Number(row.annual_fee) || 0,
      color: CHART_COLORS.emerald,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function finalizeHealthScore(summary: DashboardSummary, healthyRatio: number) {
  const issueWeight =
    summary.pendingSetupPayments +
    summary.pendingYearlyPayments +
    summary.unreadFeedback +
    summary.expired * 2 +
    summary.dueSoon +
    summary.pendingModuleRequests;

  const issuePenalty = Math.min(40, issueWeight * 1.8);
  const raw = Math.round(healthyRatio * 60 + 40 - issuePenalty);
  const score = Math.max(0, Math.min(100, raw));

  if (score >= 90) return { score, grade: "A", label: "Excellent" };
  if (score >= 75) return { score, grade: "B", label: "Healthy" };
  if (score >= 60) return { score, grade: "C", label: "Needs attention" };
  if (score >= 40) return { score, grade: "D", label: "At risk" };
  return { score, grade: "F", label: "Critical" };
}

export function computePortfolioHealthScore(
  summary: DashboardSummary,
  tenants: TenantListItem[],
): { score: number; grade: string; label: string } {
  if (summary.companies + summary.branches === 0) {
    return { score: 100, grade: "A", label: "No tenants yet" };
  }

  const activeHealthy = tenants.filter(
    (t) => t.subscription_state === "ACTIVE",
  ).length;
  const total = tenants.length || summary.companies + summary.branches;
  const healthyRatio = total > 0 ? activeHealthy / total : 0.85;
  return finalizeHealthScore(summary, healthyRatio);
}

/** Fast score for the topbar pill — counts only, no tenants list needed. */
export function computeQuickHealthScore(summary: DashboardSummary): {
  score: number;
  grade: string;
  label: string;
} {
  const total = summary.companies + summary.branches;
  if (total === 0) return { score: 100, grade: "A", label: "No tenants yet" };
  const healthyEstimate = total - summary.expired - summary.dueSoon;
  const healthyRatio = Math.max(0, healthyEstimate) / total;
  return finalizeHealthScore(summary, healthyRatio);
}

export function buildPortfolioInsights(
  summary: DashboardSummary,
  tenants: TenantListItem[],
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  const health = computePortfolioHealthScore(summary, tenants);

  if (summary.pendingSetupPayments > 0) {
    insights.push({
      id: "setup-payments",
      title: `${summary.pendingSetupPayments} setup payment${summary.pendingSetupPayments === 1 ? "" : "s"} waiting`,
      description: "New tenants are blocked until setup fees are approved.",
      severity: "warning",
      href: "/payments/setup",
      metric: String(summary.pendingSetupPayments),
    });
  }

  if (summary.pendingYearlyPayments > 0) {
    insights.push({
      id: "yearly-payments",
      title: `${summary.pendingYearlyPayments} yearly payment${summary.pendingYearlyPayments === 1 ? "" : "s"} pending`,
      description: "Verify transaction refs and approve to extend subscriptions.",
      severity: "warning",
      href: "/payments/yearly",
      metric: String(summary.pendingYearlyPayments),
    });
  }

  if (summary.expired > 0) {
    insights.push({
      id: "expired",
      title: `${summary.expired} subscription${summary.expired === 1 ? "" : "s"} expired`,
      description: "Renewal risk — follow up before access is restricted.",
      severity: "critical",
      href: "/tenants?filter=inactive",
      metric: String(summary.expired),
    });
  }

  if (summary.dueSoon > 0) {
    insights.push({
      id: "due-soon",
      title: `${summary.dueSoon} subscription${summary.dueSoon === 1 ? "" : "s"} due within 30 days`,
      description: "Upcoming renewals worth chasing this week.",
      severity: "info",
      href: "/tenants",
      metric: String(summary.dueSoon),
    });
  }

  if (summary.unreadFeedback > 0) {
    insights.push({
      id: "unread-feedback",
      title: `${summary.unreadFeedback} unread feedback item${summary.unreadFeedback === 1 ? "" : "s"}`,
      description: "Tenants are waiting for a response.",
      severity: "warning",
      href: "/feedback",
      metric: String(summary.unreadFeedback),
    });
  }

  if (summary.pendingModuleRequests > 0) {
    insights.push({
      id: "module-requests",
      title: `${summary.pendingModuleRequests} module request${summary.pendingModuleRequests === 1 ? "" : "s"}`,
      description: "Pending INVENTORY / HR module activations.",
      severity: "warning",
      href: "/modules",
      metric: String(summary.pendingModuleRequests),
    });
  }

  if (health.score >= 85 && insights.length === 0) {
    insights.push({
      id: "healthy",
      title: "Portfolio is in great shape",
      description: `${summary.companies} companies active with clear queues. Keep monitoring renewals.`,
      severity: "success",
      href: "/reports",
      metric: `${health.score}%`,
    });
  }

  const revenue = Number(summary.yearRevenue) || 0;
  if (revenue > 0) {
    insights.push({
      id: "revenue",
      title: `${formatETB(revenue)} recorded this year`,
      description: `${summary.payments} payment${summary.payments === 1 ? "" : "s"} so far in ${new Date().getFullYear()}.`,
      severity: "info",
      href: "/reports",
    });
  }

  const recentGrowth = aggregateTenantGrowth(tenants);
  const lastMonth = recentGrowth[recentGrowth.length - 1];
  if (lastMonth && lastMonth.count > 0) {
    insights.push({
      id: "growth",
      title: `+${lastMonth.count} new tenant${lastMonth.count === 1 ? "" : "s"} in ${lastMonth.label}`,
      description: `${summary.companies + summary.branches} total on the platform.`,
      severity: "success",
      href: "/reports",
      metric: `+${lastMonth.count}`,
    });
  }

  return insights.slice(0, 5);
}

export function formatETB(amount: number): string {
  return `ETB ${amount.toLocaleString("en-ET", { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/* Polling context — one shared summary for shell, badges, dashboard    */
/* ------------------------------------------------------------------ */

/** Queue-badge poll interval. Override with NEXT_PUBLIC_APEX_SUMMARY_POLL_MS. */
const POLL_INTERVAL_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_APEX_SUMMARY_POLL_MS;
  const n = raw ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 5_000) return n;
  return 60_000;
})();

type ApexDashboardContextValue = {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
};

const ApexDashboardContext = createContext<ApexDashboardContextValue | null>(null);

export function ApexDashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const coordinator = useLoadCoordinator();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSummaryRef = useRef(false);

  useEffect(() => {
    hasSummaryRef.current = summary != null;
  }, [summary]);

  const refresh = useCallback(
    async (force = false) => {
      if (!getApexToken()) {
        router.push("/");
        return;
      }
      if (force) invalidateApexCaches("vs:summary");

      await coordinator.run(async (isStale) => {
        const isInitial = !hasSummaryRef.current;
        if (isInitial) setLoading(true);
        setError(null);
        try {
          const data = await fetchDashboardSummary();
          if (!isStale()) setSummary(data);
        } catch (e) {
          const msg = mapApiError(e, "Failed to load dashboard");
          if (!isStale() && msg) setError(msg);
        } finally {
          if (!isStale() && isInitial) setLoading(false);
        }
      });
    },
    [coordinator, router],
  );

  useEffect(() => {
    if (!getApexToken()) {
      router.push("/");
      return;
    }
    void refresh(false);
  }, [router, refresh]);

  // Keep sidebar/topbar badges fresh without a manual refresh.
  useEffect(() => {
    if (!getApexToken()) return;
    const timer = window.setInterval(() => {
      void refresh(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo(
    () => ({ summary, loading, error, refresh }),
    [summary, loading, error, refresh],
  );

  return (
    <ApexDashboardContext.Provider value={value}>{children}</ApexDashboardContext.Provider>
  );
}

export function useApexDashboard() {
  const ctx = useContext(ApexDashboardContext);
  if (!ctx) {
    throw new Error("useApexDashboard must be used within ApexDashboardProvider");
  }
  return ctx;
}
