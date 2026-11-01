"use client";

import Link from "next/link";
import { Activity, AlertTriangle, Clock3, MessageCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeQuickHealthScore,
  type DashboardSummary,
} from "@/lib/admin/dashboard";

/** Compact portfolio-health pill for the topbar (links to Analytics). */
export function ApexHeaderHealthPill({ summary }: { summary: DashboardSummary }) {
  const health = computeQuickHealthScore(summary);

  return (
    <Link
      href="/reports"
      className="apex-health-pill group hidden items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 transition-all hover:border-primary/30 hover:bg-primary/10 sm:flex"
      title={`Portfolio health: ${health.label}`}
    >
      <Activity className="h-3.5 w-3.5 text-primary" />
      <span className="text-[11px] font-semibold tabular-nums text-foreground">
        {health.score}%
      </span>
      <span className="text-[10px] font-bold text-primary">{health.grade}</span>
    </Link>
  );
}

/** Summary chips for the tenants list page — active / due soon / expired / unread. */
export function ApexTenantListSummary({
  tenants,
  total,
}: {
  tenants: { subscription_state: string; unread_feedback?: number }[];
  total: number;
}) {
  const active = tenants.filter((t) => t.subscription_state === "ACTIVE").length;
  const dueSoon = tenants.filter((t) => t.subscription_state === "DUE_SOON").length;
  const expired = tenants.filter((t) => t.subscription_state === "EXPIRED").length;
  const unpaid = tenants.filter((t) => t.subscription_state === "UNPAID").length;
  const unread = tenants.filter((t) => (t.unread_feedback ?? 0) > 0).length;

  const chips = [
    { label: "Active", value: active, icon: Activity, tone: "text-[oklch(0.92_0.04_155)]" },
    { label: "Due soon", value: dueSoon, icon: Clock3, tone: "text-[oklch(0.92_0.05_75)]" },
    { label: "Expired", value: expired, icon: XCircle, tone: "text-[oklch(0.92_0.04_25)]" },
    { label: "Never paid", value: unpaid, icon: AlertTriangle, tone: "text-[oklch(0.92_0.03_265)]" },
    { label: "Unread feedback", value: unread, icon: MessageCircle, tone: "text-[oklch(0.92_0.04_230)]" },
  ].filter((c) => c.value > 0);

  if (chips.length === 0) return null;

  return (
    <div className="apex-tenant-summary flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-white/3 p-3">
      <p className="mr-2 text-xs font-medium text-muted-foreground">
        Showing {tenants.length} of {total}
      </p>
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/8",
              chip.tone,
            )}
          >
            <Icon className="h-3 w-3 opacity-80" />
            {chip.value} {chip.label.toLowerCase()}
          </span>
        );
      })}
    </div>
  );
}
