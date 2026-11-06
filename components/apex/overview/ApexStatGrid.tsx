import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Clock,
  CreditCard,
  MessageCircle,
  PauseCircle,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/apex/actions";
import { APEX_STAT_STYLES, type ApexStatKey } from "@/lib/apex/apexPalette";

const STATS: {
  key: ApexStatKey;
  title: string;
  href?: string;
  icon: typeof UserPlus;
}[] = [
  {
    key: "pendingSetupPayments",
    title: "Setup payments",
    href: "/payments/setup",
    icon: UserPlus,
  },
  {
    key: "pendingYearlyPayments",
    title: "Yearly payments",
    href: "/payments/yearly",
    icon: CreditCard,
  },
  {
    key: "unreadFeedback",
    title: "Unread chats",
    href: "/feedback",
    icon: MessageCircle,
  },
  {
    key: "setupPendingTenants",
    title: "Setup not approved",
    href: "/signups",
    icon: Users,
  },
  {
    key: "billingHoldTenants",
    title: "Billing hold",
    href: "/tenants",
    icon: PauseCircle,
  },
  {
    key: "graceOrExpiredTenants",
    title: "Grace / expired",
    href: "/tenants",
    icon: AlertTriangle,
  },
  { key: "trialsEndingSoon", title: "Trials ending (7d)", icon: Clock },
  {
    key: "trialExpiredTenants",
    title: "Trial expired (awaiting setup)",
    href: "/payments/setup",
    icon: Clock,
  },
  { key: "suspendedTenants", title: "Suspended", icon: AlertTriangle },
  { key: "bannedTenants", title: "Banned", icon: Ban },
];

export function ApexStatGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STATS.map((stat, index) => {
        const value = summary[stat.key];
        const Icon = stat.icon;
        const styles = APEX_STAT_STYLES[stat.key];
        const needsAttention = value > 0 && Boolean(stat.href);

        const inner = (
          <Card
            className={cn(
              "apex-stat-card apex-stat-stagger apex-panel-surface overflow-hidden border-2 p-0",
              styles.accent,
              stat.href && "apex-stat-card-interactive cursor-pointer",
              needsAttention && "apex-stat-card-attention",
              styles.card,
            )}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className={cn("h-1 w-full", styles.topBar)} />
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    styles.icon,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-3xl font-bold tabular-nums tracking-tight",
                      styles.value,
                    )}
                  >
                    {value}
                  </p>
                  {needsAttention ? (
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Needs review →
                    </p>
                  ) : null}
                </div>
              </div>
              {stat.href ? (
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              ) : null}
            </CardContent>
          </Card>
        );

        if (stat.href) {
          return (
            <Link
              key={stat.key}
              href={stat.href}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.05_85/0.5)]"
            >
              {inner}
            </Link>
          );
        }
        return <div key={stat.key}>{inner}</div>;
      })}
    </div>
  );
}

export function ApexTotalTenantsBanner({ total }: { total: number }) {
  return (
    <Card className="apex-hero-banner apex-panel-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 apex-hero-shimmer opacity-40" aria-hidden />
      <div className="h-1 bg-linear-to-r from-primary via-[oklch(0.72_0.08_85)] to-[oklch(0.68_0.12_300)]" />
      <CardContent className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-2">
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Live portfolio
          </p>
          <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
            {total}
          </p>
          <p className="text-sm text-muted-foreground">Wholesalers on VoloSync</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
          Every wholesaler in one operations console — payments, onboarding,
          billing, and wholesaler chat without switching tools.
        </p>
      </CardContent>
    </Card>
  );
}
