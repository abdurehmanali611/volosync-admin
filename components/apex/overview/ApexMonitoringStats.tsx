import Link from "next/link";
import { ArrowUpRight, CreditCard, MessageCircle, Puzzle, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/admin/dashboard";

type MonitoringStatKey =
  | "pendingSetupPayments"
  | "pendingYearlyPayments"
  | "pendingModuleRequests"
  | "unreadFeedback";

const MONITORING_STATS: {
  key: MonitoringStatKey;
  title: string;
  href: string;
  icon: typeof UserPlus;
  iconClass: string;
  accent: string;
  topBar: string;
  attention?: boolean;
}[] = [
  {
    key: "pendingSetupPayments",
    title: "Setup payments",
    href: "/payments/setup",
    icon: UserPlus,
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    iconClass:
      "bg-[oklch(0.32_0.06_162)] text-[oklch(0.92_0.04_162)] ring-1 ring-[oklch(0.69_0.16_162/0.4)] shadow-[0_0_16px_-4px_oklch(0.69_0.16_162/0.35)]",
    attention: true,
  },
  {
    key: "pendingYearlyPayments",
    title: "Yearly payments",
    href: "/payments/yearly",
    icon: CreditCard,
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    iconClass:
      "bg-[oklch(0.28_0.05_300)] text-[oklch(0.9_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.38)] shadow-[0_0_16px_-4px_oklch(0.62_0.1_300/0.32)]",
    attention: true,
  },
  {
    key: "pendingModuleRequests",
    title: "Module requests",
    href: "/modules",
    icon: Puzzle,
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    iconClass:
      "bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)] shadow-[0_0_16px_-4px_oklch(0.62_0.1_300/0.28)]",
    attention: true,
  },
  {
    key: "unreadFeedback",
    title: "Unread feedback",
    href: "/feedback",
    icon: MessageCircle,
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    iconClass:
      "bg-[oklch(0.3_0.05_230)] text-[oklch(0.92_0.04_230)] ring-1 ring-[oklch(0.65_0.12_230/0.35)] shadow-[0_0_16px_-4px_oklch(0.65_0.12_230/0.3)]",
    attention: true,
  },
];

/** The four derivable action-queue counters (polled badge source). */
export function ApexMonitoringStats({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MONITORING_STATS.map((stat) => {
        const value = summary[stat.key];
        const Icon = stat.icon;
        const needsAttention = stat.attention && value > 0;

        const inner = (
          <Card
            className={cn(
              "apex-stat-card apex-panel-surface overflow-hidden border-2 p-0",
              stat.accent,
              "apex-stat-card-interactive cursor-pointer",
              needsAttention && "apex-stat-card-attention",
            )}
          >
            <div className={cn("h-1 w-full", stat.topBar)} />
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    stat.iconClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {value}
                  </p>
                  {needsAttention ? (
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Needs review →
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Queue is clear</p>
                  )}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[oklch(0.8_0.04_162)]" />
            </CardContent>
          </Card>
        );

        return (
          <Link
            key={stat.key}
            href={stat.href}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
