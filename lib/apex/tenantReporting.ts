import { CHART_COLORS, type ChartSlice } from "@/lib/apex/analytics";
import type { TenantDetail } from "@/lib/apex/actions";

type Payment = TenantDetail["recentPayments"][number];
type StaffUser = TenantDetail["users"][number];
type OpsSnapshot = TenantDetail["operationalSnapshot"];

export type TenantPaymentTrendPoint = {
  key: string;
  label: string;
  amount: number;
  count: number;
};

export type TenantReportingKpis = {
  collectedETB: number;
  pendingETB: number;
  rejectedETB: number;
  paymentCount: number;
  activeStaff: number;
  disabledStaff: number;
  pendingOps: number;
  modulesCount: number;
  renewalFeeETB: number;
  renewalLabel: string;
  paidUntilLabel: string;
  healthScore: number;
  healthLabel: string;
};

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  if (!y || !m) return key;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function buildTenantReportingKpis(
  tenant: TenantDetail,
  payments: Payment[],
): TenantReportingKpis {
  const renewalFeeETB = tenant.yearlyFeeETB;

  let collectedETB = 0;
  let pendingETB = 0;
  let rejectedETB = 0;
  for (const p of payments) {
    const amount = Number(p.amountETB) || 0;
    const status = String(p.status || "").toLowerCase();
    if (status === "approved" || status === "paid") collectedETB += amount;
    else if (status === "pending") pendingETB += amount;
    else if (status === "rejected") rejectedETB += amount;
  }

  const activeStaff = tenant.users.filter((u) => !u.loginDisabled).length;
  const disabledStaff = tenant.users.filter((u) => u.loginDisabled).length;
  const snap = tenant.operationalSnapshot;
  const pendingOps =
    (snap?.pendingPurchaseRequests ?? 0) +
    (snap?.pendingStockOutRequests ?? 0) +
    (snap?.pendingItemRegistrations ?? 0) +
    (snap?.openOrders ?? 0);

  let healthScore = 72;
  const sub = String(tenant.subscriptionStatus || "").toLowerCase();
  if (sub === "active") healthScore += 18;
  else if (sub === "warning" || sub === "trial") healthScore += 8;
  else if (sub === "grace") healthScore -= 8;
  else if (sub === "expired" || sub === "on_hold") healthScore -= 22;
  else if (sub === "setup_pending" || sub === "pending_approval") healthScore -= 10;

  const account = String(tenant.accountStatus || "").toLowerCase();
  if (account === "suspended") healthScore -= 25;
  if (account === "banned") healthScore -= 40;
  if (tenant.billingHold) healthScore -= 12;
  if (disabledStaff > 0) healthScore -= Math.min(12, disabledStaff * 4);
  if (pendingOps > 8) healthScore -= 10;
  else if (pendingOps > 3) healthScore -= 5;
  if (tenant.isIllustrationTenant || sub === "exempt") healthScore = Math.min(healthScore, 55);

  healthScore = Math.max(5, Math.min(100, healthScore));

  let healthLabel = "Stable";
  if (healthScore >= 85) healthLabel = "Healthy";
  else if (healthScore >= 65) healthLabel = "Stable";
  else if (healthScore >= 45) healthLabel = "Needs attention";
  else healthLabel = "At risk";

  return {
    collectedETB,
    pendingETB,
    rejectedETB,
    paymentCount: payments.length,
    activeStaff,
    disabledStaff,
    pendingOps,
    modulesCount: tenant.modules?.length ?? 0,
    renewalFeeETB,
    renewalLabel: "Yearly fee",
    paidUntilLabel: tenant.subscriptionPaidUntil
      ? new Date(tenant.subscriptionPaidUntil).toLocaleDateString()
      : "Not set",
    healthScore,
    healthLabel,
  };
}

export function aggregateTenantPaymentTrend(
  payments: Payment[],
): TenantPaymentTrendPoint[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const p of payments) {
    const key = monthKey(p.submittedAt);
    if (key === "unknown") continue;
    const prev = map.get(key) ?? { amount: 0, count: 0 };
    prev.amount += Number(p.amountETB) || 0;
    prev.count += 1;
    map.set(key, prev);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, v]) => ({
      key,
      label: monthLabel(key),
      amount: Math.round(v.amount),
      count: v.count,
    }));
}

export function aggregateTenantPaymentStatus(payments: Payment[]): ChartSlice[] {
  const buckets = {
    approved: 0,
    pending: 0,
    rejected: 0,
    other: 0,
  };
  for (const p of payments) {
    const status = String(p.status || "").toLowerCase();
    if (status === "approved" || status === "paid") buckets.approved += 1;
    else if (status === "pending") buckets.pending += 1;
    else if (status === "rejected") buckets.rejected += 1;
    else buckets.other += 1;
  }
  return [
    {
      key: "approved",
      label: "Approved",
      value: buckets.approved,
      color: CHART_COLORS.emerald,
    },
    {
      key: "pending",
      label: "Pending",
      value: buckets.pending,
      color: CHART_COLORS.amber,
    },
    {
      key: "rejected",
      label: "Rejected",
      value: buckets.rejected,
      color: CHART_COLORS.danger,
    },
    {
      key: "other",
      label: "Other",
      value: buckets.other,
      color: CHART_COLORS.slate,
    },
  ].filter((s) => s.value > 0);
}

export function aggregateTenantPaymentKinds(payments: Payment[]): ChartSlice[] {
  const map = new Map<string, number>();
  for (const p of payments) {
    const kind = String(p.paymentKind || "other").toLowerCase();
    map.set(kind, (map.get(kind) ?? 0) + 1);
  }
  const colors: Record<string, string> = {
    setup: CHART_COLORS.gold,
    yearly: CHART_COLORS.teal,
  };
  const labels: Record<string, string> = {
    setup: "Setup",
    yearly: "Yearly",
  };
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value,
      color: colors[key] ?? CHART_COLORS.sky,
    }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateTenantStaffRoles(users: StaffUser[]): ChartSlice[] {
  const map = new Map<string, number>();
  for (const u of users) {
    const role = String(u.Role || "Unassigned").trim() || "Unassigned";
    map.set(role, (map.get(role) ?? 0) + 1);
  }
  const palette = [
    CHART_COLORS.teal,
    CHART_COLORS.gold,
    CHART_COLORS.violet,
    CHART_COLORS.emerald,
    CHART_COLORS.sky,
    CHART_COLORS.amber,
    CHART_COLORS.slate,
  ];
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value], i) => ({
      key: label,
      label,
      value,
      color: palette[i % palette.length],
    }));
}

export function aggregateTenantOpsBars(
  snapshot: OpsSnapshot | null | undefined,
): { label: string; value: number; color: string }[] {
  if (!snapshot) return [];
  return [
    {
      label: "Staff",
      value: snapshot.staffCount,
      color: CHART_COLORS.teal,
    },
    {
      label: "Orders",
      value: snapshot.ordersToday ?? 0,
      color: CHART_COLORS.gold,
    },
    {
      label: "Open",
      value: snapshot.openOrders ?? 0,
      color: CHART_COLORS.sky,
    },
    {
      label: "PRs",
      value: snapshot.pendingPurchaseRequests ?? 0,
      color: CHART_COLORS.amber,
    },
    {
      label: "Stock",
      value: snapshot.pendingStockOutRequests ?? 0,
      color: CHART_COLORS.violet,
    },
    {
      label: "Items",
      value: snapshot.pendingItemRegistrations ?? 0,
      color: CHART_COLORS.emerald,
    },
  ];
}
