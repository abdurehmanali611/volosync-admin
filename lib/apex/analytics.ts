import type {
  AuditLogRow,
  DashboardSummary,
  FeedbackThreadRow,
  ModuleChangeRequestRow,
  TenantListItem,
} from "./actions";

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

export type IssueCategory = {
  key: string;
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
  href: string;
  description: string;
};

export type PortfolioInsight = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "success" | "info";
  href?: string;
  metric?: string;
};

export type RevenueEstimate = {
  yearlyRecurringETB: number;
  setupPipelineETB: number;
  activeTenants: number;
  avgYearlyFeeETB: number;
};

export const CHART_COLORS = {
  teal: "oklch(0.62 0.12 195)",
  gold: "oklch(0.72 0.08 85)",
  violet: "oklch(0.62 0.1 300)",
  emerald: "oklch(0.62 0.14 155)",
  amber: "oklch(0.72 0.12 75)",
  danger: "oklch(0.65 0.18 25)",
  sky: "oklch(0.65 0.12 230)",
  slate: "oklch(0.55 0.02 265)",
} as const;

const SUBSCRIPTION_COLORS: Record<string, string> = {
  active: CHART_COLORS.emerald,
  trial: CHART_COLORS.gold,
  exempt: CHART_COLORS.slate,
  warning: CHART_COLORS.amber,
  grace: CHART_COLORS.amber,
  expired: CHART_COLORS.danger,
  on_hold: CHART_COLORS.violet,
  setup_pending: CHART_COLORS.sky,
  pending_approval: CHART_COLORS.teal,
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  setup_pending: "Setup pending",
  pending_approval: "Payment pending",
  active: "Active",
  warning: "Renewal soon",
  grace: "Grace period",
  expired: "Expired",
  on_hold: "Billing hold",
  trial: "Free trial",
  exempt: "Exempt",
};

const ACCOUNT_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

export function aggregateSubscriptionStatus(tenants: TenantListItem[]): ChartSlice[] {
  const counts = new Map<string, number>();
  for (const t of tenants) {
    counts.set(t.subscriptionStatus, (counts.get(t.subscriptionStatus) ?? 0) + 1);
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

export function aggregateAccountStatus(tenants: TenantListItem[]): ChartSlice[] {
  const counts = new Map<string, number>();
  for (const t of tenants) {
    counts.set(t.accountStatus, (counts.get(t.accountStatus) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, value]) => ({
      key,
      label: ACCOUNT_LABELS[key] ?? key,
      value,
      color:
        key === "active"
          ? CHART_COLORS.emerald
          : key === "suspended"
            ? CHART_COLORS.amber
            : CHART_COLORS.danger,
    }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateTenantGrowth(tenants: TenantListItem[]): MonthlyGrowthPoint[] {
  const byMonth = new Map<string, number>();
  for (const t of tenants) {
    if (!t.createdAt) continue;
    const d = new Date(t.createdAt);
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

export function estimateRevenue(tenants: TenantListItem[]): RevenueEstimate {
  const active = tenants.filter(
    (t) =>
      t.subscriptionStatus === "active" ||
      t.subscriptionStatus === "warning" ||
      t.subscriptionStatus === "trial" ||
      t.subscriptionStatus === "exempt",
  );
  const setupPipeline = tenants.filter(
    (t) => t.subscriptionStatus === "setup_pending" || !t.setupFeeApproved,
  );

  const yearlyRecurringETB = active.reduce((sum, t) => sum + (t.yearlyFeeETB || 0), 0);
  const setupPipelineETB = setupPipeline.reduce((sum, t) => sum + (t.setupFeeETB || 0), 0);

  return {
    yearlyRecurringETB,
    setupPipelineETB,
    activeTenants: active.length,
    avgYearlyFeeETB:
      active.length > 0 ? Math.round(yearlyRecurringETB / active.length) : 0,
  };
}

function issueSeverity(
  condition: boolean,
  whenTrue: IssueCategory["severity"],
  whenFalse: IssueCategory["severity"] = "info",
): IssueCategory["severity"] {
  return condition ? whenTrue : whenFalse;
}

export function buildIssueCategories(
  tenants: TenantListItem[],
  summary: DashboardSummary,
): IssueCategory[] {
  const unreadChats = tenants.filter((t) => t.unreadFeedback > 0).length;
  const billingHold = tenants.filter((t) => t.billingHold).length;
  const graceExpired = tenants.filter(
    (t) => t.subscriptionStatus === "grace" || t.subscriptionStatus === "expired",
  ).length;
  const setupPending = tenants.filter((t) => t.subscriptionStatus === "setup_pending").length;
  const paymentPending = tenants.filter((t) => t.subscriptionStatus === "pending_approval").length;

  const categories: IssueCategory[] = [
    {
      key: "payments",
      label: "Payment queues",
      count:
        summary.pendingSetupPayments +
        summary.pendingYearlyPayments,
      severity: "warning",
      href: "/payments/setup",
      description: "Setup and yearly payments awaiting approval",
    },
    {
      key: "billing",
      label: "Billing at risk",
      count: billingHold + graceExpired + summary.billingHoldTenants,
      severity: issueSeverity(billingHold + graceExpired > 0, "critical"),
      href: "/tenants",
      description: "Billing holds, grace periods, and expired subscriptions",
    },
    {
      key: "onboarding",
      label: "Onboarding backlog",
      count: setupPending + summary.setupPendingTenants,
      severity: issueSeverity(setupPending > 0, "warning"),
      href: "/signups",
      description: "Wholesalers waiting for setup approval or fee payment",
    },
    {
      key: "accounts",
      label: "Account restrictions",
      count: summary.suspendedTenants + summary.bannedTenants,
      severity: issueSeverity(summary.suspendedTenants + summary.bannedTenants > 0, "critical"),
      href: "/tenants",
      description: "Suspended or banned wholesalers",
    },
    {
      key: "communication",
      label: "Unread wholesaler chat",
      count: unreadChats || summary.unreadFeedback,
      severity: issueSeverity(unreadChats > 0, "warning"),
      href: "/feedback",
      description: "Tenants waiting for a reply in wholesaler chat",
    },
    {
      key: "modules",
      label: "Module change requests",
      count: summary.pendingModuleRequests,
      severity: issueSeverity(summary.pendingModuleRequests > 0, "warning"),
      href: "/modules",
      description: "Pending module additions or changes",
    },
    {
      key: "users",
      label: "Disabled logins",
      count: summary.disabledUsers,
      severity: issueSeverity(summary.disabledUsers > 0, "warning"),
      href: "/users",
      description: "Tenant staff accounts with login disabled",
    },
    {
      key: "trials",
      label: "Trial deadlines",
      count: summary.trialsEndingSoon + summary.trialExpiredTenants,
      severity: issueSeverity(summary.trialExpiredTenants > 0, "critical"),
      href: "/tenants",
      description: "Trials ending within 7 days or already expired",
    },
    {
      key: "payment-pending",
      label: "Awaiting payment proof",
      count: paymentPending,
      severity: issueSeverity(paymentPending > 0, "warning"),
      href: "/payments/setup",
      description: "Wholesalers with subscription payment pending approval",
    },
  ];
  return categories.filter((c) => c.count > 0);
}

export function computePortfolioHealthScore(
  summary: DashboardSummary,
  tenants: TenantListItem[],
): { score: number; grade: string; label: string } {
  if (summary.totalTenants === 0) {
    return { score: 100, grade: "A", label: "No tenants yet" };
  }

  const activeHealthy = tenants.filter(
    (t) =>
      t.accountStatus === "active" &&
      (t.subscriptionStatus === "active" ||
        t.subscriptionStatus === "trial" ||
        t.subscriptionStatus === "exempt"),
  ).length;

  const healthyRatio = tenants.length > 0 ? activeHealthy / tenants.length : 0.85;
  return finalizeHealthScore(summary, healthyRatio);
}

export function computeQuickHealthScore(summary: DashboardSummary): {
  score: number;
  grade: string;
  label: string;
} {
  if (summary.totalTenants === 0) {
    return { score: 100, grade: "A", label: "No tenants yet" };
  }
  const healthyEstimate =
    summary.totalTenants -
    summary.suspendedTenants -
    summary.bannedTenants -
    summary.graceOrExpiredTenants -
    summary.billingHoldTenants;
  const healthyRatio = Math.max(0, healthyEstimate) / summary.totalTenants;
  return finalizeHealthScore(summary, healthyRatio);
}

function finalizeHealthScore(summary: DashboardSummary, healthyRatio: number) {
  const issueWeight =
    summary.pendingSetupPayments +
    summary.pendingYearlyPayments +
    summary.unreadFeedback +
    summary.suspendedTenants * 3 +
    summary.bannedTenants * 5 +
    summary.graceOrExpiredTenants * 2 +
    summary.billingHoldTenants * 2 +
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

export function buildPortfolioInsights(
  summary: DashboardSummary,
  tenants: TenantListItem[],
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  const revenue = estimateRevenue(tenants);
  const health = computePortfolioHealthScore(summary, tenants);

  if (summary.pendingSetupPayments > 0) {
    insights.push({
      id: "setup-payments",
      title: `${summary.pendingSetupPayments} setup payment${summary.pendingSetupPayments === 1 ? "" : "s"} waiting`,
      description: "New wholesalers are blocked until setup fees are approved.",
      severity: "warning",
      href: "/payments/setup",
      metric: String(summary.pendingSetupPayments),
    });
  }

  if (summary.graceOrExpiredTenants > 0) {
    insights.push({
      id: "grace-expired",
      title: `${summary.graceOrExpiredTenants} propert${summary.graceOrExpiredTenants === 1 ? "y" : "ies"} in grace or expired`,
      description: "Renewal risk — follow up before access is restricted.",
      severity: "critical",
      href: "/tenants",
      metric: String(summary.graceOrExpiredTenants),
    });
  }

  if (summary.unreadFeedback > 0) {
    insights.push({
      id: "unread-chat",
      title: `${summary.unreadFeedback} unread chat thread${summary.unreadFeedback === 1 ? "" : "s"}`,
      description: "Tenants are waiting for a response in wholesaler chat.",
      severity: "warning",
      href: "/feedback",
      metric: String(summary.unreadFeedback),
    });
  }

  if (health.score >= 85 && insights.length === 0) {
    insights.push({
      id: "healthy",
      title: "Portfolio is in great shape",
      description: `${summary.totalTenants} wholesalers active with clear queues. Keep monitoring renewals.`,
      severity: "success",
      href: "/reports",
      metric: `${health.score}%`,
    });
  }

  if (revenue.yearlyRecurringETB > 0) {
    insights.push({
      id: "revenue",
      title: `${formatETB(revenue.yearlyRecurringETB)} yearly recurring`,
      description: `Across ${revenue.activeTenants} paying wholesalers · avg ${formatETB(revenue.avgYearlyFeeETB)} per renewal`,
      severity: "info",
      href: "/reports",
    });
  }

  const recentGrowth = aggregateTenantGrowth(tenants);
  const lastMonth = recentGrowth[recentGrowth.length - 1];
  if (lastMonth && lastMonth.count > 0) {
    insights.push({
      id: "growth",
      title: `+${lastMonth.count} new propert${lastMonth.count === 1 ? "y" : "ies"} in ${lastMonth.label}`,
      description: `${summary.totalTenants} total on the platform.`,
      severity: "success",
      href: "/reports",
      metric: `+${lastMonth.count}`,
    });
  }

  return insights.slice(0, 5);
}

export function aggregateAuditActivity(logs: AuditLogRow[]): ChartSlice[] {
  const byDay = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()]
    .map(([key, value], i) => ({
      key,
      label: key,
      value,
      color: i % 2 === 0 ? CHART_COLORS.teal : CHART_COLORS.gold,
    }))
    .slice(-14);
}

export function aggregateFeedbackActivity(threads: FeedbackThreadRow[]): {
  open: number;
  closed: number;
  unread: number;
} {
  let open = 0;
  let closed = 0;
  let unread = 0;
  for (const t of threads) {
    if (t.status === "open" || t.status === "active") open++;
    else closed++;
    unread += t.unreadFromTenant ?? 0;
  }
  return { open, closed, unread };
}

export function aggregateModuleRequests(requests: ModuleChangeRequestRow[]): ChartSlice[] {
  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;
  return [
    { key: "pending", label: "Pending", value: pending, color: CHART_COLORS.amber },
    { key: "approved", label: "Approved", value: approved, color: CHART_COLORS.emerald },
    { key: "rejected", label: "Rejected", value: rejected, color: CHART_COLORS.danger },
  ].filter((s) => s.value > 0);
}

export function formatETB(amount: number): string {
  return `${amount.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}
