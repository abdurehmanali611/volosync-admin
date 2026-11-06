"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Banknote,
  Clock3,
  HeartPulse,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApexDonutChart } from "@/components/apex/charts/ApexDonutChart";
import { ApexActivityBarChart } from "@/components/apex/charts/ApexAreaBarCharts";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { CHART_COLORS } from "@/lib/apex/analytics";
import type { TenantDetail } from "@/lib/apex/actions";
import {
  aggregateTenantOpsBars,
  aggregateTenantPaymentKinds,
  aggregateTenantPaymentStatus,
  aggregateTenantPaymentTrend,
  aggregateTenantStaffRoles,
  buildTenantReportingKpis,
} from "@/lib/apex/tenantReporting";
import { cn } from "@/lib/utils";

function formatETB(n: number) {
  return `${Math.round(n).toLocaleString()} ETB`;
}

function PaymentTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; payload: { count: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const amount = payload.find((p) => p.dataKey === "amount");
  const count = amount?.payload?.count ?? 0;
  return (
    <div className="apex-chart-tooltip rounded-lg border border-white/10 bg-[oklch(0.18_0.025_265/95)] px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular-nums text-foreground">
        {formatETB(Number(amount?.value ?? 0))}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {count} submission{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Banknote;
  tone: "gold" | "teal" | "emerald" | "violet" | "amber" | "danger";
}) {
  const tones = {
    gold: {
      bar: "apex-stat-topbar-gold",
      icon: "bg-[oklch(0.32_0.05_85)] text-[oklch(0.9_0.05_85)] ring-1 ring-[oklch(0.7_0.08_85/0.35)]",
    },
    teal: {
      bar: "apex-stat-topbar-teal",
      icon: "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.4)]",
    },
    emerald: {
      bar: "apex-stat-topbar-emerald",
      icon: "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
    },
    violet: {
      bar: "apex-stat-topbar-violet",
      icon: "bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)]",
    },
    amber: {
      bar: "apex-stat-topbar-amber",
      icon: "bg-[oklch(0.32_0.05_75)] text-[oklch(0.92_0.04_75)] ring-1 ring-[oklch(0.7_0.1_75/0.35)]",
    },
    danger: {
      bar: "apex-stat-topbar-danger",
      icon: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)]",
    },
  } as const;
  const t = tones[tone];

  return (
    <Card className="apex-stat-card apex-panel-surface overflow-hidden border-2 p-0">
      <div className={cn("h-1", t.bar)} />
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 85
      ? CHART_COLORS.emerald
      : score >= 65
        ? CHART_COLORS.teal
        : score >= 45
          ? CHART_COLORS.amber
          : CHART_COLORS.danger;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <Card className="apex-panel-surface apex-chart-card border-2 overflow-hidden">
      <div className="h-1 bg-linear-to-r from-[oklch(0.62_0.12_155/0.7)] via-[oklch(0.62_0.1_195/0.55)] to-[oklch(0.72_0.08_85/0.5)]" />
      <CardHeader className="border-b border-white/6 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.55_0.1_155/0.3)]">
            <HeartPulse className="h-4 w-4" />
          </span>
          Wholesaler health
        </CardTitle>
        <CardDescription className="text-[13px]">
          Subscription, access, and operations combined
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-5 pt-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke="oklch(1 0 0 / 8%)"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {score}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              / 100
            </span>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Badge
            variant="outline"
            className="border-transparent font-medium"
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`,
              color,
            }}
          >
            {label}
          </Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Score blends billing standing, account access, disabled logins, and
            pending operational queues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApexTenantReporting({
  tenant,
  payments,
}: {
  tenant: TenantDetail;
  payments: TenantDetail["recentPayments"];
}) {
  const kpis = buildTenantReportingKpis(tenant, payments);
  const trend = aggregateTenantPaymentTrend(payments);
  const statusSlices = aggregateTenantPaymentStatus(payments);
  const kindSlices = aggregateTenantPaymentKinds(payments);
  const roleSlices = aggregateTenantStaffRoles(tenant.users);
  const opsBars = aggregateTenantOpsBars(tenant.operationalSnapshot);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.75_0.04_85)]">
          Analytics
        </p>
        <h2 className="text-lg font-semibold tracking-tight">Wholesaler reports</h2>
        <p className="text-sm text-muted-foreground">
          Billing, staff mix, and live operations for {tenant.hotelDisplayName}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Collected"
          value={formatETB(kpis.collectedETB)}
          sub={`${kpis.paymentCount} payment record${kpis.paymentCount === 1 ? "" : "s"}`}
          icon={Banknote}
          tone="gold"
        />
        <KpiCard
          label="Pending review"
          value={formatETB(kpis.pendingETB)}
          sub={
            kpis.pendingETB > 0
              ? "Awaiting Apex approval"
              : "No payments waiting"
          }
          icon={Clock3}
          tone={kpis.pendingETB > 0 ? "amber" : "teal"}
        />
        <KpiCard
          label="Staff access"
          value={`${kpis.activeStaff} active`}
          sub={
            kpis.disabledStaff > 0
              ? `${kpis.disabledStaff} login disabled`
              : "All logins enabled"
          }
          icon={Users}
          tone={kpis.disabledStaff > 0 ? "danger" : "emerald"}
        />
        <KpiCard
          label={kpis.renewalLabel}
          value={formatETB(kpis.renewalFeeETB)}
          sub={`Paid until ${kpis.paidUntilLabel}`}
          icon={ShieldCheck}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <HealthRing score={kpis.healthScore} label={kpis.healthLabel} />
        </div>
        <Card className="apex-panel-surface apex-chart-card border-2 lg:col-span-3">
          <CardHeader className="border-b border-white/6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.3_0.04_85)] text-[oklch(0.9_0.05_85)] ring-1 ring-[oklch(0.7_0.08_85/0.3)]">
                <Banknote className="h-4 w-4" />
              </span>
              Payment volume
            </CardTitle>
            <CardDescription className="text-[13px]">
              Submitted amounts by month for this wholesaler
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {trend.length === 0 ? (
              <ApexEmptyState
                icon={Banknote}
                title="No payment history"
                description="Approved and pending submissions will chart here."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="tenantPayGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={CHART_COLORS.gold}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_COLORS.gold}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(1 0 0 / 6%)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "oklch(0.72 0.03 95)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.72 0.03 95)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                      }
                    />
                    <Tooltip content={<PaymentTrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={CHART_COLORS.gold}
                      strokeWidth={2.5}
                      fill="url(#tenantPayGradient)"
                    />
                    <Bar
                      dataKey="amount"
                      fill={CHART_COLORS.teal}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                      opacity={0.35}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ApexDonutChart
          title="Payment status"
          description="Share of submissions by approval state"
          data={statusSlices}
          centerLabel="payments"
          centerValue={payments.length}
        />
        <ApexDonutChart
          title="Staff by role"
          description="Account mix across this wholesaler"
          data={roleSlices}
          centerLabel="staff"
          centerValue={tenant.users.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ApexDonutChart
          title="Payment kinds"
          description="Setup vs renewal submissions"
          data={kindSlices}
          centerLabel="kinds"
          centerValue={kindSlices.length}
        />
        <ApexActivityBarChart
          title="Live operations"
          description="Staff, orders, and pending workflows right now"
          data={opsBars}
        />
      </div>

      <Card className="apex-panel-surface apex-chart-card border-2 overflow-hidden">
        <div className="h-1 bg-linear-to-r from-[oklch(0.62_0.1_300/0.55)] via-[oklch(0.62_0.12_195/0.45)] to-[oklch(0.72_0.08_85/0.4)]" />
        <CardHeader className="border-b border-white/6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)]">
              <Layers3 className="h-4 w-4" />
            </span>
            Enabled modules
          </CardTitle>
          <CardDescription className="text-[13px]">
            {kpis.modulesCount} module{kpis.modulesCount === 1 ? "" : "s"}{" "}
            assigned to this tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {tenant.modules.length === 0 ? (
            <ApexEmptyState
              icon={Layers3}
              title="No modules assigned"
              description="Assign modules from the Modules section below."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tenant.modules.map((mod) => (
                <span
                  key={mod}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <Activity className="h-3 w-3 text-[oklch(0.72_0.08_195)]" />
                  {mod}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
