"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { TrendingUp } from "lucide-react";
import type { MonthlyGrowthPoint } from "@/lib/admin/dashboard";
import { CHART_COLORS } from "@/constants/apexPalette";

function GrowthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="apex-chart-tooltip rounded-lg border border-white/10 bg-[oklch(0.18_0.025_265/95)] px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-bold tabular-nums text-foreground">
          {p.dataKey === "count" ? `+${p.value} new` : `${p.value} total`}
        </p>
      ))}
    </div>
  );
}

export function ApexTenantGrowthChart({ data }: { data: MonthlyGrowthPoint[] }) {
  return (
    <Card className="apex-panel-surface apex-chart-card border-2">
      <CardHeader className="border-b border-white/6 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.3_0.04_162)] text-[oklch(0.88_0.04_162)] ring-1 ring-[oklch(0.6_0.12_162/0.3)]">
            <TrendingUp className="h-4 w-4" />
          </span>
          Tenant growth
        </CardTitle>
        <CardDescription className="text-[13px]">
          New tenant registrations and cumulative portfolio size over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {data.length === 0 ? (
          <ApexEmptyState
            icon={TrendingUp}
            title="No growth data yet"
            description="Registration dates will populate this chart."
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
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
                  allowDecimals={false}
                />
                <Tooltip content={<GrowthTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={CHART_COLORS.emerald}
                  strokeWidth={2}
                  fill="url(#growthGradient)"
                />
                <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ApexActivityBarChart({
  title,
  description,
  data,
  emptyTitle = "No activity",
  emptyDescription = "Activity will appear here.",
  money = false,
}: {
  title: string;
  description?: string;
  data: { label: string; value: number; color: string }[];
  emptyTitle?: string;
  emptyDescription?: string;
  money?: boolean;
}) {
  return (
    <Card className="apex-panel-surface apex-chart-card border-2">
      <CardHeader className="border-b border-white/6 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-[13px]">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-5">
        {data.length === 0 ? (
          <ApexEmptyState
            icon={TrendingUp}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "oklch(0.72 0.03 95)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-24}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={{ fill: "oklch(0.72 0.03 95)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tickFormatter={
                    money
                      ? (v: number) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}M`
                            : v >= 1_000
                              ? `${Math.round(v / 1_000)}K`
                              : String(v)
                      : undefined
                  }
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="apex-chart-tooltip rounded-lg border border-white/10 bg-[oklch(0.18_0.025_265/95)] px-3 py-2 shadow-xl">
                        <p className="text-xs font-medium text-muted-foreground">
                          {payload[0].payload.label}
                        </p>
                        <p className="text-sm font-bold tabular-nums">
                          {money
                            ? `ETB ${(Number(payload[0].value) || 0).toLocaleString("en-ET")}`
                            : payload[0].value}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
