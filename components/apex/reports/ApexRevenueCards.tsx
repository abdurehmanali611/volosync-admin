"use client";

import { Banknote, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatETB, type RevenueEstimate } from "@/lib/apex/analytics";

const METRICS = [
  {
    key: "yearly" as const,
    label: "Yearly recurring",
    sublabel: "Active subscription fees",
    icon: TrendingUp,
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    iconClass:
      "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.4)]",
    valueClass: "text-[oklch(0.92_0.04_195)]",
  },
  {
    key: "setup" as const,
    label: "Setup pipeline",
    sublabel: "Pending onboarding fees",
    icon: Wallet,
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    iconClass:
      "bg-[oklch(0.32_0.06_85)] text-[oklch(0.92_0.04_85)] ring-1 ring-[oklch(0.72_0.08_85/0.4)]",
    valueClass: "text-[oklch(0.94_0.04_85)]",
  },
  {
    key: "avg" as const,
    label: "Avg yearly fee",
    sublabel: "Per paying wholesaler",
    icon: Banknote,
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    iconClass:
      "bg-[oklch(0.28_0.05_300)] text-[oklch(0.9_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.38)]",
    valueClass: "text-[oklch(0.92_0.03_300)]",
  },
];

function valueFor(key: (typeof METRICS)[number]["key"], revenue: RevenueEstimate) {
  if (key === "yearly") return formatETB(revenue.yearlyRecurringETB);
  if (key === "setup") return formatETB(revenue.setupPipelineETB);
  return formatETB(revenue.avgYearlyFeeETB);
}

export function ApexRevenueCards({ revenue }: { revenue: RevenueEstimate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {METRICS.map((metric, i) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.key}
            className={cn(
              "apex-stat-card apex-stat-stagger apex-panel-surface overflow-hidden border-2 p-0",
              metric.accent,
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={cn("h-1 w-full", metric.topBar)} />
            <CardContent className="flex items-start gap-4 p-5">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  metric.iconClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className={cn("mt-0.5 text-2xl font-bold tabular-nums tracking-tight", metric.valueClass)}>
                  {valueFor(metric.key, revenue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.sublabel}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
