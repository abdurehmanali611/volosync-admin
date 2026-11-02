"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CreditCard, LayoutDashboard, UserPlus } from "lucide-react";
import {
  useApexDashboard,
  fetchTenants,
  fetchPlatformReport,
  aggregateSubscriptionStatus,
  aggregateTenantGrowth,
  buildPortfolioInsights,
  topTenantsByAnnualFee,
  type TenantListItem,
  type PlatformReport,
} from "@/lib/admin/dashboard";
import { getApexMember } from "@/lib/admin/session";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexSectionHeader } from "@/components/apex/layout/ApexFilterTabs";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import {
  ApexStatGrid,
  ApexTotalTenantsBanner,
} from "@/components/apex/overview/ApexStatGrid";
import { ApexDashboardQuickActions } from "@/components/apex/overview/ApexDashboardQuickActions";
import { ApexModuleBreakdown } from "@/components/apex/overview/ApexModuleBreakdown";
import { ApexMonitoringStats } from "@/components/apex/overview/ApexMonitoringStats";
import { ApexPortfolioHealth } from "@/components/apex/overview/ApexPortfolioHealth";
import { ApexInsightsPanel } from "@/components/apex/overview/ApexInsightsPanel";
import { ApexDonutChart } from "@/components/apex/charts/ApexDonutChart";
import {
  ApexTenantGrowthChart,
  ApexActivityBarChart,
} from "@/components/apex/charts/ApexAreaBarCharts";
import { Button } from "@/components/ui/button";

export default function DashboardHomePage() {
  const { summary, loading, error } = useApexDashboard();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [report, setReport] = useState<PlatformReport | null>(null);
  const member = getApexMember();
  const firstName = (member?.name || member?.username || "there").split(/\s+/)[0];

  useEffect(() => {
    if (!summary) return;
    void fetchTenants()
      .then(setTenants)
      .catch(() => setTenants([]));
    void fetchPlatformReport()
      .then(setReport)
      .catch(() => setReport(null));
  }, [summary]);

  if (loading && !summary) {
    return <ApexPageLoader label="Loading overview…" />;
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <ApexPageHeader
          title="Overview"
          description="Platform snapshot and action queues"
        />
        <ApexErrorAlert message={error} />
      </div>
    );
  }

  if (!summary) {
    return (
      <ApexEmptyState
        icon={LayoutDashboard}
        title="No overview data"
        description="Refresh the page or check your connection to the Apex API."
      />
    );
  }

  const totalTenants = summary.companies + summary.branches;
  const pendingTotal =
    summary.pendingSetupPayments +
    summary.pendingYearlyPayments +
    summary.pendingModuleRequests +
    summary.unreadFeedback;

  const insights = buildPortfolioInsights(summary, tenants);
  const subscriptionChart = aggregateSubscriptionStatus(tenants);
  const growthChart = aggregateTenantGrowth(tenants);
  const topTenantsChart = topTenantsByAnnualFee(report?.rows ?? []);

  return (
    <div className="space-y-10">
      <ApexPageHeader
        title={`Welcome back, ${firstName}`}
        description={
          pendingTotal > 0
            ? `${pendingTotal} item${pendingTotal === 1 ? "" : "s"} across your queues need attention today.`
            : `${totalTenants} tenants on VoloSync — all queues are clear.`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link href="/tenants">
                <Building2 className="mr-2 h-4 w-4" />
                All tenants
              </Link>
            </Button>
            <Button asChild size="sm" variant="apex">
              <Link href="/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link href="/payments/setup">
                <UserPlus className="mr-2 h-4 w-4" />
                Setup payments
              </Link>
            </Button>
          </div>
        }
      />

      <ApexDashboardQuickActions summary={summary} />

      {tenants.length > 0 ? (
        <ApexPortfolioHealth summary={summary} tenants={tenants} />
      ) : (
        <ApexTotalTenantsBanner total={totalTenants} />
      )}

      {insights.length > 0 ? <ApexInsightsPanel insights={insights} /> : null}

      <section className="space-y-5">
        <ApexSectionHeader
          title="Platform snapshot"
          description="Companies, branches, renewals, revenue, and inventory in one grid."
        />
        <ApexStatGrid summary={summary} />
      </section>

      <section className="space-y-5">
        <ApexSectionHeader
          title="Action queues"
          description="Setup payments, yearly payments, module requests, and feedback awaiting review."
        />
        <ApexMonitoringStats summary={summary} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {subscriptionChart.length > 0 ? (
          <ApexDonutChart
            title="Subscription mix"
            description="Live breakdown across your portfolio"
            data={subscriptionChart}
            centerValue={totalTenants}
            centerLabel="Tenants"
          />
        ) : null}
        <ApexModuleBreakdown tenants={tenants} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApexTenantGrowthChart data={growthChart} />
        <ApexActivityBarChart
          title="Top tenants by annual fee"
          description="Highest-value main tenants from the platform report"
          data={topTenantsChart}
          money
          emptyTitle="No fee data yet"
          emptyDescription="Annual fees appear here once tenants are billed."
        />
      </section>

      {report?.totals ? (
        <section className="apex-panel-surface apex-alert-card grid gap-4 rounded-xl border border-white/8 p-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Portfolio stock value
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
              ETB {Number(report.totals.stock_value || 0).toLocaleString("en-ET")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Annual fees (all tenants)
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
              ETB {Number(report.totals.annual_fee || 0).toLocaleString("en-ET")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Payments on record
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold tabular-nums text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              {report.totals.payments}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
