"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchTenantDetail,
  fetchTenantPaymentHistory,
  approveSetup,
  approveYearly,
  rejectSetup,
  releaseHold,
  suspendTenant,
  unsuspendTenant,
  banTenant,
  unbanTenant,
  deleteTenant,
  restoreDeletedTenant,
  setUserLoginDisabled,
  applySuggestedTenantFees,
  updateTenantBilling,
  updateTenantModules,
  syncTenantStaffModules,
  type TenantDetail,
} from "@/lib/apex/actions";
import { Button } from "@/components/ui/button";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexTenantSummaryStrip } from "@/components/apex/tenant/ApexTenantSummaryStrip";
import { ApexTenantLogoEditor } from "@/components/apex/tenant/ApexTenantLogoEditor";
import {
  ApexTenantSectionNav,
  TENANT_TABS,
  type TenantTabId,
} from "@/components/apex/tenant/ApexTenantSectionNav";
import { ApexTenantFamilyTabs } from "@/components/apex/tenant/ApexTenantFamilyTabs";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { ApexTenantReporting } from "@/components/apex/tenant/ApexTenantReporting";
import { ApexTenantBillingActions } from "@/components/apex/tenant/ApexTenantBillingActions";
import { ApexTenantBillingSettings } from "@/components/apex/tenant/ApexTenantBillingSettings";
import { ApexTenantAccessControl } from "@/components/apex/tenant/ApexTenantAccessControl";
import { ApexTenantModulesEditor } from "@/components/apex/tenant/ApexTenantModulesEditor";
import { ApexTenantStaffTable } from "@/components/apex/tenant/ApexTenantStaffTable";
import { ApexTenantPaymentsTable } from "@/components/apex/tenant/ApexTenantPaymentsTable";
import { ApexPortfolioOwnerPanel } from "@/components/apex/tenant/ApexPortfolioOwnerPanel";
import { ApexTenantExcelImport } from "@/components/apex/tenant/ApexTenantExcelImport";
import { ApexTenantBranches } from "@/components/apex/tenant/ApexTenantBranches";

export default function TenantDetailPage() {
  const params = useParams();
  const tin = decodeURIComponent(String(params.tin ?? ""));
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [payments, setPayments] = useState<TenantDetail["recentPayments"]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TenantTabId>("reports");
  const { refresh: refreshSummary } = useApexDashboard();

  const reload = useCallback(async () => {
    const [detail, history] = await Promise.all([
      fetchTenantDetail(tin),
      fetchTenantPaymentHistory(tin, 50),
    ]);
    setTenant(detail);
    setPayments(history);
  }, [tin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Load failed"),
    );
  }, [reload]);

  useEffect(() => {
    // A satellite page has no Branches or Owner tab; keep the panel visible.
    if (tenant?.isBranch && (tab === "branches" || tab === "owner")) {
      setTab("reports");
    }
  }, [tenant?.isBranch, tab]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      toast.success("Updated");
      await reload();
      void refreshSummary(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!tenant) {
    return <ApexPageLoader label="Loading tenant…" />;
  }

  return (
    <div className="space-y-6">
      <ApexPageHeader
        title={tenant.hotelDisplayName}
        description={`TIN ${tenant.tinNumber}`}
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: tenant.hotelDisplayName },
        ]}
        actions={
          tenant.accountStatus === "active" ? (
            <Button asChild size="sm" variant="apex">
              <Link href={`/feedback?tin=${encodeURIComponent(tin)}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Open chat
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ApexTenantFamilyTabs
        family={tenant.family}
        currentTin={tenant.tinNumber}
      />

      <ApexTenantSummaryStrip tenant={tenant} />

      <ApexTenantLogoEditor
        key={`logo-${tenant.tinNumber}-${tenant.logoUrl || ""}`}
        tenant={tenant}
        busy={busy}
        onSaved={() => reload()}
      />

      <ApexTenantSectionNav
        value={tab}
        onValueChange={setTab}
        tabs={
          tenant.isBranch
            ? TENANT_TABS.filter(
                (section) => section.id !== "branches" && section.id !== "owner",
              )
            : TENANT_TABS
        }
      />

      <div key={tab} className="apex-tenant-tab-panel min-w-0 space-y-6">
        {tab === "reports" ? (
          <ApexTenantReporting tenant={tenant} payments={payments} />
        ) : null}

        {tab === "payments" ? (
          <div className="space-y-6">
            <ApexTenantBillingActions
              tenant={tenant}
              busy={busy}
              onApproveSetup={() => run(() => approveSetup(tin))}
              onRejectSetup={(reason) => run(() => rejectSetup(tin, reason))}
              onApproveRenewal={() => run(() => approveYearly(tin))}
              onReleaseHold={() => run(() => releaseHold(tin))}
              onSetBillingHold={() =>
                run(() => updateTenantBilling(tin, { billingHold: true }))
              }
            />
            <ApexTenantPaymentsTable
              tinNumber={tin}
              payments={payments}
              busy={busy}
              onChanged={() => reload()}
            />
          </div>
        ) : null}

        {tab === "access" ? (
          <ApexTenantAccessControl
            tenant={tenant}
            reason={reason}
            busy={busy}
            onReasonChange={setReason}
            onSuspend={() => run(() => suspendTenant(tin, reason))}
            onBan={() => run(() => banTenant(tin, reason))}
            onUnsuspend={() => run(() => unsuspendTenant(tin))}
            onUnban={() => run(() => unbanTenant(tin))}
            onDelete={() => run(() => deleteTenant(tin, reason))}
            onRestore={() => run(() => restoreDeletedTenant(tin, reason || undefined))}
          />
        ) : null}

        {tab === "billing" ? (
          <ApexTenantBillingSettings
            key={`billing-${tenant.tinNumber}-${tenant.setupFeeETB}-${tenant.yearlyFeeETB}-${tenant.feesManuallySet}`}
            tenant={tenant}
            busy={busy}
            onApplyCatalog={() => run(() => applySuggestedTenantFees(tin))}
            onSave={(values) =>
              run(() =>
                updateTenantBilling(tin, {
                  setupFeeETB: values.setupFeeETB,
                  yearlyFeeETB: values.yearlyFeeETB,
                  billingNotes: values.billingNotes,
                  isIllustrationTenant: values.isIllustrationTenant,
                  billingHold: values.billingHold,
                  freeTrialEndsAt: values.freeTrialEndsAt,
                }),
              )
            }
          />
        ) : null}

        {tab === "modules" ? (
          <ApexTenantModulesEditor
            key={`modules-${tenant.tinNumber}-${(tenant.modules as string[]).join(",")}`}
            tenant={tenant}
            busy={busy}
            onSaveModules={(modules, recalcFees) =>
              run(() => updateTenantModules(tin, modules, recalcFees))
            }
            onSyncStaff={() => run(() => syncTenantStaffModules(tin))}
          />
        ) : null}

        {tab === "excel" ? (
          <ApexTenantExcelImport
            key={`excel-${tenant.tinNumber}-${(tenant.modules as string[]).join(",")}`}
            tenant={tenant}
          />
        ) : null}

        {tab === "staff" ? (
          <ApexTenantStaffTable
            users={tenant.users}
            busy={busy}
            onToggleLogin={(userId, wasDisabled) =>
              run(() =>
                setUserLoginDisabled(userId, !wasDisabled, reason || undefined),
              )
            }
          />
        ) : null}

        {tab === "branches" ? (
          <ApexTenantBranches
            tenantId={tenant.id}
            tenantTin={tenant.tinNumber}
            busy={busy}
            onChanged={() => reload()}
          />
        ) : null}

        {tab === "owner" ? (
          <ApexPortfolioOwnerPanel
            tinNumber={tin}
            hotelDisplayName={tenant.hotelDisplayName}
          />
        ) : null}
      </div>
    </div>
  );
}
