"use client";

import Link from "next/link";
import { Activity, AlertTriangle, Ban, MessageCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeQuickHealthScore } from "@/lib/apex/analytics";
import type { DashboardSummary } from "@/lib/apex/actions";

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

export function ApexTenantListSummary({
  tenants,
  total,
}: {
  tenants: { subscriptionStatus: string; accountStatus: string; billingHold: boolean; unreadFeedback: number }[];
  total: number;
}) {
  const active = tenants.filter((t) => t.subscriptionStatus === "active").length;
  const atRisk = tenants.filter(
    (t) =>
      t.subscriptionStatus === "grace" ||
      t.subscriptionStatus === "expired" ||
      t.billingHold,
  ).length;
  const restricted = tenants.filter(
    (t) => t.accountStatus === "suspended" || t.accountStatus === "banned",
  ).length;
  const unread = tenants.filter((t) => t.unreadFeedback > 0).length;

  const chips = [
    { label: "Active", value: active, icon: Activity, tone: "text-[oklch(0.92_0.04_155)]" },
    { label: "At risk", value: atRisk, icon: AlertTriangle, tone: "text-[oklch(0.92_0.05_75)]" },
    { label: "Restricted", value: restricted, icon: Ban, tone: "text-[oklch(0.92_0.04_25)]" },
    { label: "Unread chat", value: unread, icon: MessageCircle, tone: "text-[oklch(0.92_0.04_195)]" },
    {
      label: "Billing hold",
      value: tenants.filter((t) => t.billingHold).length,
      icon: PauseCircle,
      tone: "text-[oklch(0.92_0.03_300)]",
    },
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
