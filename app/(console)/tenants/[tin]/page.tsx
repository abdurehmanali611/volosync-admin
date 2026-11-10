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
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
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

  const mainMember = tenant?.isBranch
    ? (tenant.family.find((member) => member.isMain) ?? null)
    : null;
  const mainTin = mainMember?.tinNumber ?? null;
  const mainMemberLogo = mainMember?.logoUrl ?? null;
  const [mainTenant, setMainTenant] = useState<TenantDetail | null>(null);

  useEffect(() => {
    if (!mainTin) return;
    let alive = true;
    fetchTenantDetail(mainTin)
      .then((detail) => {
        if (alive) setMainTenant(detail);
      })
      .catch((e) => {
        if (alive) toast.error(e instanceof Error ? e.message : "Load failed");
      });
    return () => {
      alive = false;
    };
    // The family logo changes after a logo save, so re-read the main then.
  }, [mainTin, mainMemberLogo]);

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

  // A satellite branch displays the main branch's logo in the summary strip.
  const mainFamilyLogo = tenant.isBranch
    ? (tenant.family.find((member) => member.isMain)?.logoUrl ?? null)
    : undefined;

  // Logo, Branches and Owner always belong to the family's main branch.
  const familyMain = tenant.isBranch
    ? mainTenant && mainTenant.tinNumber === mainTin
      ? mainTenant
      : null
    : tenant;
  const logoTarget = familyMain ?? tenant;

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

      <ApexTenantSummaryStrip tenant={tenant} logoUrlOverride={mainFamilyLogo} />

      <ApexTenantLogoEditor
        key={`logo-${logoTarget.tinNumber}-${logoTarget.logoUrl || ""}-${familyMain ? "edit" : "lock"}`}
        tenant={logoTarget}
        inheritedLogoUrl={
          tenant.isBranch && !familyMain ? mainFamilyLogo : undefined
        }
        scopeNote={
          tenant.isBranch && familyMain
            ? `You are viewing ${tenant.hotelDisplayName} (branch). Logo changes apply to ${familyMain.hotelDisplayName}, the main branch, and every satellite.`
            : undefined
        }
        busy={busy}
        onSaved={() => reload()}
      />

      <ApexTenantSectionNav
        value={tab}
        onValueChange={setTab}
        tabs={TENANT_TABS}
      />

      <div key={tab} className="apex-tenant-tab-panel min-w-0 space-y-6">
        {tenant.isBranch &&
        familyMain &&
        (tab === "branches" || tab === "owner") ? (
          <p className="text-xs text-muted-foreground">
            Satellite view — this panel manages{" "}
            <span className="font-medium text-foreground">
              {familyMain.hotelDisplayName}
            </span>
            , the main branch of the family.
          </p>
        ) : null}
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
          familyMain ? (
            <ApexTenantBranches
              tenantId={familyMain.id}
              tenantTin={familyMain.tinNumber}
              busy={busy}
              onChanged={() => reload()}
            />
          ) : (
            <ApexTableSkeleton rows={4} cols={4} />
          )
        ) : null}

        {tab === "owner" ? (
          familyMain ? (
            <ApexPortfolioOwnerPanel
              tinNumber={familyMain.tinNumber}
              hotelDisplayName={familyMain.hotelDisplayName}
            />
          ) : (
            <ApexTableSkeleton rows={3} cols={3} />
          )
        ) : null}
      </div>
    </div>
  );
}
