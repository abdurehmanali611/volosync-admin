"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IssueCategory } from "@/lib/apex/analytics";

const SEVERITY = {
  critical: {
    bar: "bg-[oklch(0.58_0.12_25)]",
    badge: "bg-[oklch(0.58_0.12_25/0.15)] text-[oklch(0.92_0.04_25)] ring-[oklch(0.58_0.12_25/0.3)]",
    icon: ShieldAlert,
  },
  warning: {
    bar: "bg-[oklch(0.65_0.1_75)]",
    badge: "bg-[oklch(0.65_0.1_75/0.12)] text-[oklch(0.92_0.05_75)] ring-[oklch(0.65_0.1_75/0.25)]",
    icon: AlertTriangle,
  },
  info: {
    bar: "bg-[oklch(0.55_0.1_195)]",
    badge: "bg-[oklch(0.55_0.1_195/0.12)] text-[oklch(0.92_0.04_195)] ring-[oklch(0.55_0.1_195/0.22)]",
    icon: AlertTriangle,
  },
};

export function ApexIssuesPanel({ issues }: { issues: IssueCategory[] }) {
  const max = Math.max(...issues.map((i) => i.count), 1);

  return (
    <Card className="apex-panel-surface border-2">
      <CardHeader className="border-b border-white/6 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.58_0.12_25/0.3)]">
            <ShieldAlert className="h-4 w-4" />
          </span>
          Issues &amp; attention areas
        </CardTitle>
        <CardDescription className="text-[13px]">
          Operational hotspots across billing, onboarding, chat, and account health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {issues.length === 0 ? (
          <div className="rounded-xl border border-[oklch(0.55_0.12_155/0.25)] bg-[oklch(0.55_0.12_155/0.06)] p-6 text-center">
            <p className="text-sm font-semibold text-[oklch(0.92_0.04_155)]">All clear</p>
            <p className="mt-1 text-xs text-muted-foreground">No open issues detected in your portfolio.</p>
          </div>
        ) : (
          issues.map((issue, i) => {
            const styles = SEVERITY[issue.severity];
            const Icon = styles.icon;
            return (
              <Link
                key={issue.key}
                href={issue.href}
                className="group block rounded-xl p-3 transition-colors hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                        styles.badge,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                          {issue.label}
                        </p>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
                            styles.badge,
                          )}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{issue.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums text-foreground">{issue.count}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", styles.bar)}
                    style={{ width: `${Math.max(8, (issue.count / max) * 100)}%` }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
