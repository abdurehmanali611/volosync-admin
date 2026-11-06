"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE = {
  gold: {
    bar: "from-[oklch(0.78_0.08_85/0.8)] via-[oklch(0.65_0.06_85/0.45)] to-transparent",
    icon: "bg-[oklch(0.32_0.05_85)] text-[oklch(0.9_0.05_85)] ring-1 ring-[oklch(0.7_0.08_85/0.35)]",
  },
  teal: {
    bar: "from-[oklch(0.65_0.1_195/0.8)] via-[oklch(0.55_0.08_195/0.4)] to-transparent",
    icon: "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.35)]",
  },
  violet: {
    bar: "from-[oklch(0.62_0.1_300/0.75)] via-[oklch(0.5_0.08_300/0.4)] to-transparent",
    icon: "bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)]",
  },
  emerald: {
    bar: "from-[oklch(0.62_0.12_155/0.75)] via-[oklch(0.5_0.08_155/0.4)] to-transparent",
    icon: "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
  },
  rose: {
    bar: "from-[oklch(0.65_0.14_25/0.7)] via-[oklch(0.5_0.08_25/0.35)] to-transparent",
    icon: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)]",
  },
  slate: {
    bar: "from-[oklch(0.55_0.02_265/0.7)] via-[oklch(0.4_0.02_265/0.35)] to-transparent",
    icon: "bg-[oklch(0.28_0.02_265)] text-[oklch(0.88_0.02_85)] ring-1 ring-white/10",
  },
} as const;

export type ApexTenantTabTone = keyof typeof TONE;

export function ApexTenantTabShell({
  title,
  description,
  icon: Icon,
  tone = "teal",
  actions,
  children,
  contentClassName,
  className,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  tone?: ApexTenantTabTone;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <Card
      className={cn(
        "apex-panel-surface apex-chart-card gap-0 overflow-hidden border-2 py-0",
        className,
      )}
    >
      <div className={cn("h-1 bg-linear-to-r", t.bar)} />
      <CardHeader className="border-b border-white/6 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  t.icon,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-[13px] leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("min-w-0 px-5 py-5 sm:px-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function ApexTenantMetricTile({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/8 bg-white/3 px-3.5 py-3 transition-colors hover:border-white/12 hover:bg-white/5",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}
