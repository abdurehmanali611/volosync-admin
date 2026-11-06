"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, MessageCircle, CreditCard } from "lucide-react";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { getApexMember } from "@/lib/apex/auth";
import { fetchTenants, type TenantListItem } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexSectionHeader } from "@/components/apex/layout/ApexFilterTabs";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexStatGrid, ApexTotalTenantsBanner } from "@/components/apex/overview/ApexStatGrid";
import { ApexDashboardQuickActions } from "@/components/apex/overview/ApexDashboardQuickActions";
import { ApexBusinessTypeBreakdown } from "@/components/apex/overview/ApexBusinessTypeBreakdown";
import { ApexMonitoringStats } from "@/components/apex/overview/ApexMonitoringStats";
import { ApexPortfolioHealth } from "@/components/apex/overview/ApexPortfolioHealth";
import { ApexInsightsPanel } from "@/components/apex/overview/ApexInsightsPanel";
import { ApexDonutChart } from "@/components/apex/charts/ApexDonutChart";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import {
  aggregateSubscriptionStatus,
  buildPortfolioInsights,
} from "@/lib/apex/analytics";

export default function DashboardHomePage() {
  const { summary, loading, error } = useApexDashboard();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const member = getApexMember();
  const firstName = (member?.displayName || member?.UserName || "there").split(/\s+/)[0];

  useEffect(() => {
    if (!summary) return;
    void fetchTenants()
      .then(setTenants)
      .catch(() => setTenants([]));
  }, [summary]);

  if (loading && !summary) {
    return <ApexPageLoader label="Loading overview…" />;
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <ApexPageHeader title="Overview" description="Platform snapshot and action queues" />
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

  const pendingTotal =
    summary.pendingSetupPayments +
    summary.pendingYearlyPayments +
    summary.unreadFeedback;

  const insights = buildPortfolioInsights(summary, tenants);
  const subscriptionChart = aggregateSubscriptionStatus(tenants);

  return (
    <div className="space-y-10">
      <ApexPageHeader
        title={`Welcome back, ${firstName}`}
        description={
          pendingTotal > 0
            ? `${pendingTotal} item${pendingTotal === 1 ? "" : "s"} across your queues need attention today.`
            : `${summary.totalTenants} wholesalers on VoloSync — all queues are clear.`
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
              <Link href="/feedback">
                <MessageCircle className="mr-2 h-4 w-4" />
                Wholesaler chat
              </Link>
            </Button>
          </div>
        }
      />

      <ApexDashboardQuickActions summary={summary} />

      {tenants.length > 0 ? (
        <ApexPortfolioHealth summary={summary} tenants={tenants} />
      ) : (
        <ApexTotalTenantsBanner total={summary.totalTenants} />
      )}

      {insights.length > 0 ? <ApexInsightsPanel insights={insights} /> : null}

      <section className="space-y-5">
        <ApexSectionHeader
          title="Action queues"
          description="Click a card to open the matching workflow."
          action={
            (summary.pendingSetupPayments > 0 ||
              summary.pendingYearlyPayments > 0) ? (
              <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
                <Link href="/payments/setup">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </Link>
              </Button>
            ) : undefined
          }
        />
        <ApexStatGrid summary={summary} />
      </section>

      <section className="space-y-5">
        <ApexSectionHeader
          title="Platform monitoring"
          description="Users, module requests, and wholesaler mix across the portfolio."
        />
        <ApexMonitoringStats summary={summary} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {subscriptionChart.length > 0 ? (
          <ApexDonutChart
            title="Subscription mix"
            description="Live breakdown across your portfolio"
            data={subscriptionChart}
            centerValue={summary.totalTenants}
            centerLabel="Wholesalers"
          />
        ) : null}
        <ApexBusinessTypeBreakdown summary={summary} />
      </section>
    </div>
  );
}
