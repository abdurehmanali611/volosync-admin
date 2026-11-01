import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Building,
  Clock,
  CreditCard,
  Landmark,
  Layers,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/admin/dashboard";
import { formatETB } from "@/lib/admin/dashboard";
import { APEX_STAT_STYLES, type ApexStatKey } from "@/constants/apexPalette";

const STATS: {
  key: ApexStatKey;
  title: string;
  href?: string;
  icon: typeof Users;
  money?: boolean;
  hint?: string;
}[] = [
  { key: "companies", title: "Companies", href: "/tenants", icon: Building2 },
  { key: "branches", title: "Branches", href: "/tenants", icon: Building },
  { key: "active", title: "Active subscriptions", href: "/tenants", icon: Activity },
  { key: "dueSoon", title: "Due within 30 days", href: "/tenants?filter=inactive", icon: Clock },
  { key: "expired", title: "Expired", href: "/tenants?filter=inactive", icon: AlertTriangle },
  {
    key: "yearRevenue",
    title: "Revenue this year",
    href: "/reports",
    icon: Landmark,
    money: true,
  },
  { key: "payments", title: "Payments recorded", href: "/payments/yearly", icon: CreditCard },
  {
    key: "stockValue",
    title: "Stock value",
    href: "/reports",
    icon: Layers,
    money: true,
    hint: "Across tenant inventories",
  },
  { key: "staff", title: "Staff accounts", href: "/users", icon: Users },
];

/** Nine platform stat cards — `GET /api/tenants/dashboard/` totals. */
export function ApexStatGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STATS.map((stat, index) => {
        const raw = summary[stat.key];
        const value = stat.money ? formatETB(Number(raw) || 0) : String(raw);
        const Icon = stat.icon;
        const styles = APEX_STAT_STYLES[stat.key];
        const numeric = typeof raw === "number" ? raw : 0;
        const needsAttention =
          (stat.key === "expired" || stat.key === "dueSoon") && numeric > 0;

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
                      stat.money && "text-2xl",
                    )}
                  >
                    {value}
                  </p>
                  {needsAttention ? (
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Needs review →
                    </p>
                  ) : stat.hint ? (
                    <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
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
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.69_0.05_162/0.5)]"
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
      <div className="h-1 bg-linear-to-r from-primary via-[oklch(0.68_0.13_180)] to-[oklch(0.62_0.1_300)]" />
      <CardContent className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-2">
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Live portfolio
          </p>
          <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
            {total}
          </p>
          <p className="text-sm text-muted-foreground">Tenants on VoloSync</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
          Every wholesaler and branch in one operations console — payments, onboarding,
          billing, and module management without switching tools.
        </p>
      </CardContent>
    </Card>
  );
}
