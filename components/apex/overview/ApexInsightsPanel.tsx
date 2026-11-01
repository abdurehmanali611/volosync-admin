"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PortfolioInsight } from "@/lib/admin/dashboard";

const SEVERITY_STYLES = {
  critical: {
    icon: AlertTriangle,
    border: "border-[oklch(0.62_0.16_25/0.3)]",
    bg: "bg-[oklch(0.62_0.16_25/0.08)]",
    iconBg: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)]",
    metric: "text-[oklch(0.92_0.04_25)]",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-[oklch(0.72_0.12_75/0.28)]",
    bg: "bg-[oklch(0.72_0.12_75/0.06)]",
    iconBg: "bg-[oklch(0.34_0.06_75)] text-[oklch(0.92_0.04_75)]",
    metric: "text-[oklch(0.92_0.05_75)]",
  },
  success: {
    icon: CheckCircle2,
    border: "border-[oklch(0.6_0.12_155/0.28)]",
    bg: "bg-[oklch(0.6_0.12_155/0.06)]",
    iconBg: "bg-[oklch(0.3_0.07_155)] text-[oklch(0.9_0.04_155)]",
    metric: "text-[oklch(0.92_0.04_155)]",
  },
  info: {
    icon: Info,
    border: "border-[oklch(0.68_0.13_180/0.22)]",
    bg: "bg-[oklch(0.68_0.13_180/0.05)]",
    iconBg: "bg-[oklch(0.3_0.05_180)] text-[oklch(0.9_0.04_180)]",
    metric: "text-[oklch(0.92_0.04_180)]",
  },
};

export function ApexInsightsPanel({ insights }: { insights: PortfolioInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card className="apex-panel-surface border-2">
      <CardHeader className="border-b border-white/6 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.3_0.04_162)] text-[oklch(0.88_0.04_162)] ring-1 ring-[oklch(0.55_0.05_162/0.3)]">
            <Sparkles className="h-4 w-4" />
          </span>
          Smart insights
        </CardTitle>
        <CardDescription className="text-[13px]">
          Actionable signals from your portfolio — updated on every refresh
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
        {insights.map((insight, i) => {
          const styles = SEVERITY_STYLES[insight.severity];
          const Icon = styles.icon;
          const inner = (
            <div
              className={cn(
                "apex-insight-card group flex gap-3 rounded-xl border p-4 transition-all duration-200",
                styles.border,
                styles.bg,
                insight.href && "cursor-pointer hover:scale-[1.01] hover:shadow-lg",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  styles.iconBg,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                  {insight.metric ? (
                    <span className={cn("text-lg font-bold tabular-nums", styles.metric)}>
                      {insight.metric}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {insight.description}
                </p>
                {insight.href ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View details
                    <ArrowRight className="h-3 w-3" />
                  </p>
                ) : null}
              </div>
            </div>
          );

          if (insight.href) {
            return (
              <Link
                key={insight.id}
                href={insight.href}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {inner}
              </Link>
            );
          }
          return <div key={insight.id}>{inner}</div>;
        })}
      </CardContent>
    </Card>
  );
}
