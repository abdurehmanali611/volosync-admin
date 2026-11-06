"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import {
  fetchAuditLogs,
  fetchFeedbackThreads,
  fetchModuleChangeRequests,
  fetchTenants,
  type TenantListItem,
} from "@/lib/apex/actions";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexSectionHeader } from "@/components/apex/layout/ApexFilterTabs";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexPortfolioHealth } from "@/components/apex/overview/ApexPortfolioHealth";
import { ApexDonutChart } from "@/components/apex/charts/ApexDonutChart";
import { ApexTenantGrowthChart, ApexActivityBarChart } from "@/components/apex/charts/ApexAreaBarCharts";
import { ApexRevenueCards } from "@/components/apex/reports/ApexRevenueCards";
import { ApexIssuesPanel } from "@/components/apex/reports/ApexIssuesPanel";
import { ApexBusinessTypeBreakdown } from "@/components/apex/overview/ApexBusinessTypeBreakdown";
import { Button } from "@/components/ui/button";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";
import {
  aggregateAccountStatus,
  aggregateAuditActivity,
  aggregateFeedbackActivity,
  aggregateModuleRequests,
  aggregateSubscriptionStatus,
  aggregateTenantGrowth,
  buildIssueCategories,
  estimateRevenue,
} from "@/lib/apex/analytics";

export default function ReportsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading analytics…" />}>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const { summary, loading: summaryLoading, refresh } = useApexDashboard();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditActivity, setAuditActivity] = useState<{ label: string; value: number; color: string }[]>([]);
  const [feedbackStats, setFeedbackStats] = useState({ open: 0, closed: 0, unread: 0 });
  const [moduleSlices, setModuleSlices] = useState<{ label: string; value: number; color: string }[]>([]);
  const coordinator = useLoadCoordinator();

  const loadData = async (isStale?: () => boolean) => {
    setError(null);
    try {
      const [tenantList, logs, threads, modules] = await Promise.all([
        fetchTenants(),
        fetchAuditLogs(150),
        fetchFeedbackThreads(200),
        fetchModuleChangeRequests(),
      ]);
      if (isStale?.()) return;
      setTenants(tenantList);
      setAuditActivity(
        aggregateAuditActivity(logs).map((d) => ({
          label: d.label,
          value: d.value,
          color: d.color,
        })),
      );
      setFeedbackStats(aggregateFeedbackActivity(threads));
      setModuleSlices(
        aggregateModuleRequests(modules).map((d) => ({
          label: d.label,
          value: d.value,
          color: d.color,
        })),
      );
    } catch (e) {
      const msg = mapApexApiError(e, "Failed to load analytics");
      if (!isStale?.() && msg) setError(msg);
    }
  };

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      await loadData(isStale);
      if (!isStale()) setLoading(false);
    });
  }, [coordinator]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if ((loading || summaryLoading) && !summary) {
    return <ApexPageLoader label="Building analytics…" />;
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <ApexPageHeader title="Analytics & reports" description="Portfolio intelligence" />
        <ApexErrorAlert message={error ?? "Unable to load dashboard summary."} />
      </div>
    );
  }

  const subscriptionData = aggregateSubscriptionStatus(tenants);
  const accountData = aggregateAccountStatus(tenants);
  const growthData = aggregateTenantGrowth(tenants);
  const revenue = estimateRevenue(tenants);
  const issues = buildIssueCategories(tenants, summary);

  const exportSummary = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      portfolioHealth: summary,
      revenue,
      subscriptionBreakdown: subscriptionData,
      accountBreakdown: accountData,
      issues,
      feedback: feedbackStats,
      tenantCount: tenants.length,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volosync-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <ApexPageHeader
        title="Analytics & reports"
        description="Visual intelligence across tenants, billing, issues, and portfolio growth"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => void onRefresh()}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="apex" size="sm" className="cursor-pointer" onClick={exportSummary}>
              <Download className="mr-2 h-4 w-4" />
              Export report
            </Button>
          </div>
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPortfolioHealth summary={summary} tenants={tenants} />

      <section className="space-y-5">
        <ApexSectionHeader
          title="Revenue snapshot"
          description="Estimated recurring and pipeline revenue from current tenant fees (ETB)."
        />
        <ApexRevenueCards revenue={revenue} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApexDonutChart
          title="Subscription health"
          description="Distribution of subscription statuses across all wholesalers"
          data={subscriptionData}
          centerValue={summary.totalTenants}
          centerLabel="Total"
        />
        <ApexDonutChart
          title="Account status"
          description="Active, suspended, and banned wholesaler accounts"
          data={accountData}
          centerValue={accountData.find((d) => d.key === "active")?.value ?? 0}
          centerLabel="Active"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApexTenantGrowthChart data={growthData} />
        <ApexActivityBarChart
          title="Admin activity (14 days)"
          description="Apex team actions logged in the audit trail"
          data={auditActivity}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApexActivityBarChart
          title="Module change requests"
          description="Pending, approved, and rejected module requests"
          data={moduleSlices}
        />
        <ApexIssuesPanel issues={issues} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApexBusinessTypeBreakdown summary={summary} />
        <div className="apex-panel-surface rounded-xl border-2 p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Wholesaler chat summary</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/4 p-3 text-center ring-1 ring-white/8">
              <p className="text-2xl font-bold tabular-nums text-foreground">{feedbackStats.open}</p>
              <p className="text-[11px] text-muted-foreground">Open threads</p>
            </div>
            <div className="rounded-lg bg-white/4 p-3 text-center ring-1 ring-white/8">
              <p className="text-2xl font-bold tabular-nums text-foreground">{feedbackStats.unread}</p>
              <p className="text-[11px] text-muted-foreground">Unread</p>
            </div>
            <div className="rounded-lg bg-white/4 p-3 text-center ring-1 ring-white/8">
              <p className="text-2xl font-bold tabular-nums text-foreground">{feedbackStats.closed}</p>
              <p className="text-[11px] text-muted-foreground">Closed</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
            <Link href="/feedback">Open wholesaler chat →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
