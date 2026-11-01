"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Coins,
  Download,
  FileText,
  Package,
  Users,
} from "lucide-react";
import { ApexActivityBarChart } from "@/components/apex/charts/ApexAreaBarCharts";
import { ApexDonutChart } from "@/components/apex/charts/ApexDonutChart";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexSectionHeader } from "@/components/apex/layout/ApexFilterTabs";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { Button } from "@/components/ui/button";
import { useSystemRefresh } from "@/hooks/useSystemRefresh";
import { mapApiError } from "@/lib/admin/core";
import { money } from "@/lib/admin/api";
import {
  fetchPlatformReport,
  fetchTenants,
  type PlatformReport,
  type TenantListItem,
} from "@/lib/admin/dashboard";

const STATE_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "oklch(0.68 0.13 162)" },
  DUE_SOON: { label: "Renewal soon", color: "oklch(0.75 0.12 75)" },
  EXPIRED: { label: "Expired", color: "oklch(0.62 0.16 25)" },
  UNPAID: { label: "Never paid", color: "oklch(0.55 0.03 265)" },
};

export default function ReportsPage() {
  const [report, setReport] = React.useState<PlatformReport | null>(null);
  const [tenants, setTenants] = React.useState<TenantListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [months, setMonths] = React.useState(6);
  const [version, setVersion] = React.useState(0);

  const load = React.useCallback(() => setVersion((v) => v + 1), []);
  const refresh = () => load();

  // Reload with the shell's single system refresh button.
  useSystemRefresh(refresh);

  React.useEffect(() => {
    let alive = true;
    void Promise.all([fetchPlatformReport(), fetchTenants()])
      .then(([nextReport, list]) => {
        if (!alive) return;
        setReport(nextReport);
        setTenants(list);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError(mapApiError(e, "Could not load analytics."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const subscriptionSlices = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const tenant of tenants) {
      counts.set(
        tenant.subscription_state,
        (counts.get(tenant.subscription_state) ?? 0) + 1,
      );
    }
    return [...counts.entries()].map(([key, value]) => ({
      key,
      label: STATE_META[key]?.label ?? key,
      value,
      color: STATE_META[key]?.color ?? "oklch(0.55 0.03 265)",
    }));
  }, [tenants]);

  const growth = React.useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number; color: string }[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-GB", { month: "short" });
      const value = tenants.filter((t) => {
        if (!t.created_at) return false;
        const c = new Date(t.created_at);
        return (
          c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
        );
      }).length;
      buckets.push({ label, value, color: "oklch(0.68 0.13 162)" });
    }
    return buckets;
  }, [tenants, months]);

  const feeByModule = React.useMemo(() => {
    const inventory = tenants.filter((t) => t.module_inventory).length;
    const hr = tenants.filter((t) => t.module_hr).length;
    const sales = tenants.filter((t) => t.sales_role_enabled).length;
    return [
      {
        key: "credentials",
        label: "Credentials",
        value: tenants.length,
        color: "oklch(0.68 0.13 162)",
      },
      { key: "inventory", label: "Inventory", value: inventory, color: "oklch(0.68 0.13 180)" },
      { key: "hr", label: "HR", value: hr, color: "oklch(0.62 0.1 300)" },
      { key: "sales", label: "Sales role", value: sales, color: "oklch(0.72 0.1 250)" },
    ];
  }, [tenants]);

  const exportCsv = () => {
    if (!report) return;
    const header = [
      "Tenant",
      "TIN",
      "Type",
      "State",
      "Annual fee",
      "Staff",
      "Lots",
      "Stock value",
      "Payments",
    ];
    const lines = [
      header.join(","),
      ...report.rows.map((row) =>
        [
          `"${row.tenant.replace(/"/g, '""')}"`,
          row.tin,
          row.is_branch ? "Branch" : "Main",
          row.state,
          row.annual_fee,
          row.staff_count,
          row.lot_count,
          row.stock_value,
          row.payments_count,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `volosync-platform-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Analytics & reports"
        description="Visual intelligence across tenants, billing, modules and portfolio growth."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Analytics" },
        ]}
        actions={
          <Button
            variant="apex"
            size="sm"
            className="cursor-pointer"
            disabled={!report}
            onClick={exportCsv}
          >
            <Download className="mr-2 size-4" /> Export report
          </Button>
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {loading && !report ? (
        <ApexTableSkeleton cols={4} />
      ) : report ? (
        <>
          <section className="space-y-4">
            <ApexSectionHeader
              title="Revenue snapshot"
              description="Recurring and pipeline revenue from current tenant fees (ETB)."
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Coins}
                label="Annual fees"
                value={money(report.totals.annual_fee)}
                hint="Sum of every tenant's yearly fee"
              />
              <StatCard
                icon={Users}
                label="Staff accounts"
                value={String(report.totals.staff)}
                hint="Active logins across all tenants"
              />
              <StatCard
                icon={Package}
                label="Stock under management"
                value={money(report.totals.stock_value)}
                hint={`${report.totals.lots} lots in the ledger`}
              />
              <StatCard
                icon={FileText}
                label="Payments recorded"
                value={String(report.totals.payments)}
                hint="Every subscription transaction"
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ApexDonutChart
              title="Subscription health"
              description="Distribution of subscription states across all tenants"
              data={subscriptionSlices}
              centerValue={String(report.totals.tenants)}
              centerLabel="Tenants"
            />
            <ApexDonutChart
              title="Module adoption"
              description="How many tenants run each module — Credentials is always on"
              data={feeByModule}
              centerValue={String(report.totals.tenants)}
              centerLabel="Tenants"
            />
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <ApexSectionHeader
                title="Tenant growth"
                description="New wholesalers onboarded per month."
              />
              <ApexPillTabs
                value={String(months)}
                onChange={(v) => setMonths(Number(v))}
                tabs={[
                  { value: "6", label: "6 months" },
                  { value: "12", label: "12 months" },
                ]}
              />
            </div>
            <ApexActivityBarChart
              title="Signups per month"
              description="Tenants created in each calendar month"
              data={growth}
              emptyTitle="No signups yet"
              emptyDescription="Create a tenant to see growth here."
            />
          </section>

          <section className="space-y-4">
            <ApexSectionHeader
              title="Portfolio breakdown"
              description="Companies versus branches and where the money sits."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                icon={Building2}
                label="Companies"
                value={String(report.rows.filter((r) => !r.is_branch).length)}
                hint="Top-level wholesalers"
              />
              <StatCard
                icon={BarChart3}
                label="Branches"
                value={String(report.rows.filter((r) => r.is_branch).length)}
                hint="Child locations"
              />
              <StatCard
                icon={Coins}
                label="Needs attention"
                value={String(
                  report.rows.filter((r) => r.state !== "ACTIVE").length,
                )}
                hint="Renewal due, expired or never paid"
              />
            </div>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Need a detailed ledger?{" "}
            <Link href="/tenants" className="text-apex-emerald hover:underline">
              Open the tenant list
            </Link>
            .
          </p>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="apex-panel-surface group relative overflow-hidden rounded-xl border border-white/8 p-4 transition-colors hover:border-apex-emerald/25">
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-apex-emerald/8 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-apex-emerald/10 text-apex-emerald ring-1 ring-apex-emerald/20">
          <Icon className="size-4" />
        </span>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="relative mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="relative mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
