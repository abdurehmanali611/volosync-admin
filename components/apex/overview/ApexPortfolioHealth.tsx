"use client";

import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSummary, TenantListItem } from "@/lib/apex/actions";
import { computePortfolioHealthScore } from "@/lib/apex/analytics";

const GRADE_COLORS: Record<string, { ring: string; text: string; bar: string }> = {
  A: {
    ring: "ring-[oklch(0.55_0.12_155/0.45)]",
    text: "text-[oklch(0.92_0.04_155)]",
    bar: "bg-[oklch(0.55_0.12_155)]",
  },
  B: {
    ring: "ring-[oklch(0.55_0.1_195/0.4)]",
    text: "text-[oklch(0.92_0.04_195)]",
    bar: "bg-[oklch(0.55_0.1_195)]",
  },
  C: {
    ring: "ring-[oklch(0.65_0.1_75/0.4)]",
    text: "text-[oklch(0.92_0.05_75)]",
    bar: "bg-[oklch(0.65_0.1_75)]",
  },
  D: {
    ring: "ring-[oklch(0.58_0.12_25/0.35)]",
    text: "text-[oklch(0.92_0.04_25)]",
    bar: "bg-[oklch(0.58_0.12_25)]",
  },
  F: {
    ring: "ring-[oklch(0.58_0.14_25/0.45)]",
    text: "text-[oklch(0.94_0.04_25)]",
    bar: "bg-[oklch(0.58_0.14_25)]",
  },
};

export function ApexPortfolioHealth({
  summary,
  tenants,
  compact = false,
}: {
  summary: DashboardSummary;
  tenants: TenantListItem[];
  compact?: boolean;
}) {
  const health = computePortfolioHealthScore(summary, tenants);
  const colors = GRADE_COLORS[health.grade] ?? GRADE_COLORS.C;

  if (compact) {
    return (
      <Link
        href="/reports"
        className="apex-health-pill group flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 transition-all hover:border-primary/30 hover:bg-primary/10"
      >
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tabular-nums text-foreground">
          {health.score}%
        </span>
        <span className={cn("text-[10px] font-bold", colors.text)}>{health.grade}</span>
      </Link>
    );
  }

  return (
    <Card className="apex-panel-surface apex-health-card relative overflow-hidden border-2">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/8 blur-2xl" />
      <CardContent className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl ring-2",
              colors.ring,
              "bg-linear-to-br from-white/8 to-white/2",
            )}
          >
            <span className={cn("text-3xl font-black", colors.text)}>{health.grade}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {health.score}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Portfolio health
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{health.label}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Based on subscription status, queue backlog, and account restrictions across{" "}
              {summary.totalTenants} wholesalers.
            </p>
          </div>
        </div>
        <div className="w-full space-y-2 sm:max-w-xs">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Health score</span>
            <span className="font-bold tabular-nums text-foreground">{health.score}/100</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <Link
            href="/reports"
            className="group mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            View full analytics
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
