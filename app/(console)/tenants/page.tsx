"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, MessageCircle, ShieldOff } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchTenants, type TenantListItem } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/components/apex/layout/ApexSearchInput";
import { ApexFilterCombobox } from "@/components/apex/layout/ApexFilterCombobox";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import {
  AccountStatusBadge,
  BusinessTypeBadge,
  SubscriptionStatusBadge,
} from "@/components/apex/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { ApexCreateTenantTrigger } from "@/components/apex/onboarding/ApexCreateTenantTrigger";
import { ApexTenantListSummary } from "@/components/apex/tenant/ApexTenantListSummary";
import { ApexTenantLogo } from "@/components/apex/tenant/ApexTenantLogo";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

type AccountStatusFilter = "all" | "active" | "suspended" | "banned" | "deleted";
type InactiveStatusFilter = "all" | "suspended" | "banned" | "deleted";

const ACCOUNT_STATUS_OPTIONS: { value: AccountStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "deleted", label: "Deleted" },
];

const INACTIVE_STATUSES = new Set(["suspended", "banned", "deleted"]);

const INACTIVE_STATUS_OPTIONS: { value: InactiveStatusFilter; label: string }[] =
  [
    { value: "all", label: "All inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "banned", label: "Banned" },
    { value: "deleted", label: "Deleted" },
  ];

function tenantsHref(opts: {
  status?: string;
  type?: string;
  filter?: string | null;
}) {
  const params = new URLSearchParams();
  if (opts.filter) params.set("filter", opts.filter);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.type && opts.type !== "all") params.set("type", opts.type);
  const qs = params.toString();
  return qs ? `/tenants?${qs}` : "/tenants";
}

function matchesAccountStatusFilter(
  accountStatus: string,
  statusFilter: AccountStatusFilter,
) {
  const status = String(accountStatus || "").toLowerCase();
  if (statusFilter === "all") return status !== "deleted";
  return status === statusFilter;
}

function isInactiveAccount(accountStatus: string) {
  return INACTIVE_STATUSES.has(String(accountStatus || "").toLowerCase());
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading tenants…" />}>
      <TenantsContent />
    </Suspense>
  );
}

function TenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams.get("filter");
  const filterInactive =
    rawFilter === "inactive" || rawFilter === "setup_pending";
  const typeFilter = searchParams.get("type") || "all";
  const rawStatus = searchParams.get("status") || "all";
  const statusFilter: AccountStatusFilter = ACCOUNT_STATUS_OPTIONS.some(
    (option) => option.value === rawStatus,
  )
    ? (rawStatus as AccountStatusFilter)
    : "all";
  const inactiveStatusFilter: InactiveStatusFilter =
    rawStatus === "suspended" || rawStatus === "banned" || rawStatus === "deleted"
      ? rawStatus
      : "all";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [allInactive, setAllInactive] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    if (rawFilter === "setup_pending") {
      router.replace("/tenants?filter=inactive");
    }
  }, [rawFilter, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchTenants(
          debouncedSearch || undefined,
          typeFilter !== "all" ? typeFilter : undefined,
        );
        if (filterInactive) {
          const inactive = list.filter((t) => isInactiveAccount(t.accountStatus));
          const filtered =
            inactiveStatusFilter === "all"
              ? inactive
              : inactive.filter(
                  (t) =>
                    String(t.accountStatus).toLowerCase() === inactiveStatusFilter,
                );
          if (!isStale()) {
            setAllInactive(inactive);
            setTenants(filtered);
          }
        } else {
          const filtered = list.filter((t) =>
            matchesAccountStatusFilter(t.accountStatus, statusFilter),
          );
          if (!isStale()) {
            setAllInactive([]);
            setTenants(filtered);
          }
        }
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load tenants");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [
    debouncedSearch,
    filterInactive,
    typeFilter,
    statusFilter,
    inactiveStatusFilter,
    coordinator,
  ]);

  const inactiveCounts = useMemo(
    () => [
      {
        value: "all" as const,
        label: "All",
        count: allInactive.length,
      },
      {
        value: "suspended" as const,
        label: "Suspended",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "suspended",
        ).length,
      },
      {
        value: "banned" as const,
        label: "Banned",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "banned",
        ).length,
      },
      {
        value: "deleted" as const,
        label: "Deleted",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "deleted",
        ).length,
      },
    ],
    [allInactive],
  );

  const columns = useMemo<ColumnDef<TenantListItem>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <ApexTenantLogo
              src={row.original.logoUrl}
              name={row.original.hotelDisplayName}
              isBranch={row.original.businessType === "Branch"}
              size={32}
            />
            <div className="min-w-0">
              <Link
                href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
                className="font-medium text-foreground transition-colors hover:text-[oklch(0.82_0.04_85)]"
              >
                {row.original.hotelDisplayName}
              </Link>
              {row.original.unreadFeedback > 0 ? (
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[oklch(0.72_0.04_220)]">
                  <MessageCircle className="h-3 w-3" />
                  {row.original.unreadFeedback} unread
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "businessType",
        header: "Type",
        cell: ({ row }) => (
          <BusinessTypeBadge businessType={row.original.businessType} />
        ),
      },
            {
        accessorKey: "tinNumber",
        header: "TIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.tinNumber}
          </span>
        ),
      },
      {
        accessorKey: "accountStatus",
        header: "Account",
        cell: ({ row }) => (
          <AccountStatusBadge status={row.original.accountStatus} />
        ),
      },
      {
        accessorKey: "subscriptionStatus",
        header: "Subscription",
        cell: ({ row }) => (
          <div>
            <SubscriptionStatusBadge status={row.original.subscriptionStatus} />
            {row.original.billingHold ? (
              <Badge variant="warning" className="ml-1">
                Hold
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "managerUsername",
        header: "Manager",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.managerUsername?.trim() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "salesAgentName",
        header: "Sales agent",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.salesAgentName?.trim() || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={filterInactive ? "Inactive Tenants" : "Tenants"}
        description={
          filterInactive
            ? "Suspended, banned, and deleted wholesalers — no volosync access while inactive"
            : statusFilter === "deleted"
              ? "Soft-deleted wholesalers kept for records — no volosync access"
              : "Search by business name, TIN, or Admin/Manager username"
        }
        breadcrumbs={
          filterInactive
            ? [
                { label: "Tenants", href: "/tenants" },
                { label: "Inactive Tenants" },
              ]
            : undefined
        }
        actions={
          !filterInactive && statusFilter !== "deleted" ? (
            <ApexCreateTenantTrigger size="sm" variant="apex">
              Create tenant
            </ApexCreateTenantTrigger>
          ) : undefined
        }
      />

      {filterInactive ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
                <ShieldOff className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Inactive snapshot
                  </p>
                  <Badge variant="secondary">
                    {inactiveStatusFilter === "all"
                      ? "All inactive"
                      : inactiveStatusFilter.charAt(0).toUpperCase() +
                        inactiveStatusFilter.slice(1)}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  These wholesalers cannot sign in to volosync until restored from
                  Access control on the tenant detail page.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
                  Suspended
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveCounts[1]?.count ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/14 bg-rose-500/6 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-200/80">
                  Banned
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveCounts[2]?.count ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/4 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Deleted
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveCounts[3]?.count ?? 0}
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <ApexFilterCombobox
          label="Account status"
          placeholder="Status"
          className="sm:w-64"
          value={filterInactive ? inactiveStatusFilter : statusFilter}
          options={
            filterInactive ? INACTIVE_STATUS_OPTIONS : ACCOUNT_STATUS_OPTIONS
          }
          onChange={(value) =>
            router.push(
              tenantsHref({
                filter: filterInactive ? "inactive" : null,
                status: value,
                type: typeFilter,
              }),
            )
          }
        />
      </div>

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search name, TIN, username…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {!loading && !filterInactive && tenants.length > 0 ? (
        <ApexTenantListSummary tenants={tenants} total={tenants.length} />
      ) : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : tenants.length === 0 ? (
          <ApexEmptyState
            icon={filterInactive ? ShieldOff : Building2}
            title={filterInactive ? "No inactive tenants" : "No tenants found"}
            description={
              debouncedSearch
                ? "Try a different search term."
                : filterInactive
                  ? inactiveStatusFilter === "all"
                    ? "No suspended, banned, or deleted wholesalers right now."
                    : `No ${inactiveStatusFilter} tenants match this filter.`
                  : statusFilter === "deleted"
                    ? "No deleted tenants yet."
                    : "No wholesalers match this filter."
            }
          />
        ) : (
          <ApexDataTable
            data={tenants}
            columns={columns}
            noun="tenants"
            pageSize={10}
          />
        )}
      </ApexPanel>
    </div>
  );
}
