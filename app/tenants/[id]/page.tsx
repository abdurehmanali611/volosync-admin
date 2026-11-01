"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Boxes,
  CalendarClock,
  Coins,
  Image as ImageIcon,
  KeyRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueueStats,
  dateLabel,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { SubscriptionStatusBadge } from "@/components/apex/StatusBadge";
import { Button } from "@/components/ui/button";
import { ApexLogoUpload } from "@/components/apex/platform/ApexLogoUpload";
import { mapApiError } from "@/lib/admin/core";
import { money } from "@/lib/admin/api";
import {
  fetchTenantDetail,
  updateTenantLogo,
  type TenantDetail,
} from "@/lib/admin/platform";
import { OwnerTab } from "./owner-tab";
import { MembersTab } from "./members-tab";
import { BillingTab } from "./billing-tab";
import { ModulesTab } from "./modules-tab";
import { PaymentsTab } from "./payments-tab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "owner", label: "Owner" },
  { value: "members", label: "Members" },
  { value: "billing", label: "Billing" },
  { value: "modules", label: "Modules" },
  { value: "payments", label: "Payments" },
];

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [tenant, setTenant] = React.useState<TenantDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("overview");

  const [version, setVersion] = React.useState(0);
  const load = React.useCallback(() => setVersion((v) => v + 1), []);

  React.useEffect(() => {
    let alive = true;
    void fetchTenantDetail(id)
      .then((row) => {
        if (alive) setTenant(row);
        if (alive) setError(null);
      })
      .catch((e) => {
        if (alive) setError(mapApiError(e, "Could not load this tenant."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, version]);

  return (
    <div className="space-y-6">
      <ApexPageHeader
        title={tenant?.name ?? "Tenant"}
        description={
          tenant
            ? `${tenant.is_branch ? "Branch" : "Main company"} · TIN ${tenant.tin}${tenant.sales_agent_name ? ` · Agent ${tenant.sales_agent_name}` : ""}`
            : "Wholesaler profile, owner account, modules and billing."
        }
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "All tenants", href: "/tenants" },
          { label: tenant?.name ?? "Tenant" },
        ]}
        actions={
          <>
            {tenant ? (
              <SubscriptionStatusBadge status={tenant.subscription_state} />
            ) : null}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href="/tenants">Back to list</Link>
            </Button>
          </>
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {loading && !tenant ? (
        <ApexTableSkeleton cols={5} />
      ) : tenant ? (
        <>
          <ApexQueueStats
            items={[
              {
                label: "Subscription",
                value: (
                  <span className="text-base">
                    {dateLabel(tenant.subscription_expires_on)}
                  </span>
                ),
                tone:
                  tenant.subscription_state === "ACTIVE" ? "emerald" : "amber",
              },
              {
                label: "Annual fee",
                value: money(tenant.annual_fee),
                tone: "emerald",
              },
              {
                label: "Stock value",
                value: money(tenant.stock_value),
                tone: "sky",
              },
              {
                label: "Footprint",
                value: (
                  <span className="text-base">
                    {tenant.counts.staff} staff · {tenant.counts.branches}{" "}
                    branches
                  </span>
                ),
              },
            ]}
          />

          <ApexPillTabs value={tab} onChange={setTab} tabs={TABS} />

          <div className="animate-in fade-in duration-300">
            {tab === "overview" ? (
              <Overview tenant={tenant} onChanged={load} />
            ) : null}
            {tab === "owner" ? (
              <OwnerTab tenantId={tenant.id} onChanged={load} />
            ) : null}
            {tab === "members" ? <MembersTab tenantId={tenant.id} /> : null}
            {tab === "billing" ? (
              <BillingTab tenant={tenant} onChanged={load} />
            ) : null}
            {tab === "modules" ? (
              <ModulesTab tenant={tenant} onChanged={load} />
            ) : null}
            {tab === "payments" ? (
              <PaymentsTab tenantId={tenant.id} onChanged={load} />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Overview({
  tenant,
  onChanged,
}: {
  tenant: TenantDetail;
  onChanged: () => void;
}) {
  const [logoUrl, setLogoUrl] = React.useState(tenant.logo_url ?? "");
  const [savingLogo, setSavingLogo] = React.useState(false);

  const saveLogo = async (next: string) => {
    if (next === (tenant.logo_url ?? "")) {
      setLogoUrl(next);
      return;
    }
    setSavingLogo(true);
    try {
      await updateTenantLogo(tenant.id, next);
      setLogoUrl(next);
      toast.success(next ? "Logo updated" : "Logo removed");
      onChanged();
    } catch (e) {
      const message = mapApiError(e, "Could not update the logo.");
      if (message) toast.error(message);
    } finally {
      setSavingLogo(false);
    }
  };

  const rows: {
    icon: typeof Building2;
    label: string;
    value: React.ReactNode;
  }[] = [
    { icon: Building2, label: "Business name", value: tenant.name },
    {
      icon: ImageIcon,
      label: "Logo",
      value: (
        <ApexLogoUpload
          value={logoUrl}
          onChange={(url) => void saveLogo(url)}
          disabled={savingLogo}
          className="justify-end"
        />
      ),
    },
    {
      icon: KeyRound,
      label: "TIN number",
      value: <span className="font-mono">{tenant.tin}</span>,
    },
    {
      icon: Users,
      label: "Sales agent",
      value: tenant.sales_agent_name || "Unattributed",
    },
    { icon: Coins, label: "VAT rate", value: `${Number(tenant.vat_rate)}%` },
    {
      icon: CalendarClock,
      label: "Created",
      value: dateLabel(tenant.created_at),
    },
    {
      icon: Boxes,
      label: "Parent company",
      value: tenant.parent_name ? (
        <Link
          href={`/tenants/${tenant.parent}`}
          className="text-apex-teal hover:underline"
        >
          {tenant.parent_name}
        </Link>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <ApexPanel
      title="Profile"
      description="Business identity recorded at onboarding."
    >
      <dl className="divide-y divide-white/5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6"
          >
            <dt className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <row.icon className="size-4 text-apex-emerald/70" />
              {row.label}
            </dt>
            <dd className="min-w-0 text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </ApexPanel>
  );
}
