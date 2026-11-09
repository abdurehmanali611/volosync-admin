"use client";

import { Building2, CalendarClock, Users, Wallet } from "lucide-react";
import { formatETB } from "@/lib/apex/analytics";
import type { TenantDetail } from "@/lib/apex/actions";
import {
  AccountStatusBadge,
  BusinessTypeBadge,
  SubscriptionStatusBadge,
} from "@/components/apex/StatusBadge";
import { cn } from "@/lib/utils";

export function ApexTenantSummaryStrip({
  tenant,
  /** Satellite branches show the main branch's logo. */
  logoUrlOverride,
}: {
  tenant: TenantDetail;
  logoUrlOverride?: string | null;
}) {
  const logoUrl = logoUrlOverride === undefined ? tenant.logoUrl : logoUrlOverride;
  const items = [
    {
      label: "Setup fee",
      value: formatETB(tenant.setupFeeETB),
      sub: tenant.setupFeeApproved ? "Approved" : "Pending approval",
      icon: Wallet,
      tone: "gold" as const,
    },
    {
      label: "Yearly fee",
      value: formatETB(tenant.yearlyFeeETB),
      sub: "Per 12 months",
      icon: Building2,
      tone: "teal" as const,
    },
    {
      label: "Paid until",
      value: tenant.subscriptionPaidUntil
        ? new Date(tenant.subscriptionPaidUntil).toLocaleDateString()
        : "—",
      sub: `${tenant.paidYearsCount} period${tenant.paidYearsCount === 1 ? "" : "s"} paid`,
      icon: CalendarClock,
      tone: "violet" as const,
    },
    {
      label: "Staff",
      value: String(tenant.users.length),
      sub: "Accounts on wholesaler",
      icon: Users,
      tone: "emerald" as const,
    },
  ];

  const toneIcon = {
    gold: "bg-[oklch(0.32_0.05_85)] text-[oklch(0.9_0.05_85)] ring-1 ring-[oklch(0.7_0.08_85/0.35)]",
    teal: "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.35)]",
    violet:
      "bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)]",
    emerald:
      "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
  };

  return (
    <div className="apex-tenant-summary-strip apex-panel-surface relative overflow-hidden rounded-2xl border border-white/8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[oklch(0.55_0.08_85/0.14)] blur-3xl" />
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-[oklch(0.5_0.08_195/0.12)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-40 rounded-full bg-[oklch(0.48_0.07_300/0.1)] blur-3xl" />
      </div>
      <div className="relative h-1 bg-linear-to-r from-[oklch(0.78_0.08_85)] via-[oklch(0.65_0.1_195)] to-[oklch(0.62_0.1_300)]" />

      <div className="relative space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-[oklch(0.82_0.05_85)]" />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.75_0.04_85)]">
                  Wholesaler profile
                </p>
                <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {tenant.hotelDisplayName}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  TIN {tenant.tinNumber}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BusinessTypeBadge businessType={tenant.businessType} />
                <AccountStatusBadge status={tenant.accountStatus} />
                <SubscriptionStatusBadge status={tenant.subscriptionStatus} />
                {tenant.billingHold ? (
                  <span className="rounded-full border border-[oklch(0.75_0.12_75/0.35)] bg-[oklch(0.55_0.05_75/0.12)] px-2.5 py-0.5 text-[11px] font-medium text-[oklch(0.88_0.04_75)]">
                    Billing hold
                  </span>
                ) : null}
                {tenant.isIllustrationTenant ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Illustration
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Primary login
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {tenant.ownerUserName || "—"}
            </p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Sales agent
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tenant.salesAgentName?.trim() || "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group rounded-xl border border-white/8 bg-white/3 p-3.5 transition-colors hover:border-white/14 hover:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      toneIcon[item.tone],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold tabular-nums tracking-tight text-foreground">
                      {item.value}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.sub}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
