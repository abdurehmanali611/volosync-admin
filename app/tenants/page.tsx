"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Building2, Handshake, Search } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { ApexTenantSummary } from "@/components/apex/platform/ApexTenantSummary";
import { ApexTenantLogo } from "@/components/apex/tenant/ApexTenantLogo";
import { ApexCreateTenantDialog } from "@/components/apex/platform/ApexCreateTenantDialog";
import { SubscriptionStatusBadge } from "@/components/apex/StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystemRefresh } from "@/hooks/useSystemRefresh";
import { mapApiError } from "@/lib/admin/core";
import { fetchTenants, type TenantListItem } from "@/lib/admin/dashboard";
import { money } from "@/lib/admin/api";

type TypeFilter = "all" | "main" | "branch";

const STATE_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DUE_SOON", label: "Renewal soon" },
  { value: "EXPIRED", label: "Expired" },
  { value: "UNPAID", label: "Never paid" },
];

export default function TenantsPage() {
  const params = useSearchParams();
  const inactiveOnly = params.get("filter") === "inactive";

  const [rows, setRows] = React.useState<TenantListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>(
    inactiveOnly ? "all" : "all",
  );
  const [stateFilter, setStateFilter] = React.useState(
    inactiveOnly ? "risk" : "all",
  );
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [version, setVersion] = React.useState(0);

  const load = React.useCallback(() => setVersion((v) => v + 1), []);
  const refresh = () => load();

  // Reload with the shell's single system refresh button.
  useSystemRefresh(refresh);

  React.useEffect(() => {
    const t = window.setTimeout(
      () => setDebounced(search.trim().toLowerCase()),
      250,
    );
    return () => window.clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    let alive = true;
    void fetchTenants()
      .then((list) => {
        if (!alive) return;
        setRows(list);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError(mapApiError(e, "Could not load tenants."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const visible = React.useMemo(() => {
    return rows.filter((row) => {
      if (typeFilter === "main" && (row.is_branch || !row.is_main))
        return false;
      if (typeFilter === "branch" && !row.is_branch) return false;
      if (stateFilter === "risk" && row.subscription_state === "ACTIVE")
        return false;
      if (
        stateFilter !== "all" &&
        stateFilter !== "risk" &&
        row.subscription_state !== stateFilter
      )
        return false;
      if (!debounced) return true;
      return (
        row.name.toLowerCase().includes(debounced) ||
        row.tin.toLowerCase().includes(debounced) ||
        (row.sales_agent_name ?? "").toLowerCase().includes(debounced)
      );
    });
  }, [rows, typeFilter, stateFilter, debounced]);

  const columns = React.useMemo<LegacyColumnDef<TenantListItem, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Business",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <ApexTenantLogo
              src={row.original.logo_url}
              isBranch={row.original.is_branch}
              name={row.original.name}
              size={34}
            />
            <div className="min-w-0 space-y-1">
              <Link
                href={`/tenants/${row.original.id}`}
                className="group flex items-center gap-2 font-medium text-foreground transition-colors hover:text-apex-emerald"
              >
                <span className="truncate group-hover:underline">
                  {row.original.name}
                </span>
              </Link>
              <p className="font-mono text-[11px] text-muted-foreground">
                {row.original.tin}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "agent",
        header: "Sales agent",
        cell: ({ row }) =>
          row.original.sales_agent_name ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Handshake className="size-3.5 text-apex-teal/70" />
              {row.original.sales_agent_name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Direct</span>
          ),
      },
      {
        accessorKey: "subscription_state",
        header: "Subscription",
        cell: ({ row }) => (
          <SubscriptionStatusBadge status={row.original.subscription_state} />
        ),
      },
      {
        accessorKey: "annual_fee",
        header: () => <div className="text-right">Annual fee</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {money(row.original.annual_fee)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              expires {row.original.subscription_expires_on ?? "—"}
            </p>
          </div>
        ),
      },
      {
        id: "footprint",
        header: "Footprint",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {row.original.staff_count} staff · {row.original.branch_count} br ·{" "}
            {row.original.lot_count} lots
          </span>
        ),
      },
    ],
    [],
  );

  const mains = rows.filter((r) => !r.is_branch).length;

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={inactiveOnly ? "Inactive tenants" : "Tenants"}
        description={
          inactiveOnly
            ? "Wholesalers whose subscription is not active — renewal or never paid."
            : "Search by business name, TIN or sales agent across every wholesaler and branch."
        }
        breadcrumbs={
          inactiveOnly
            ? [
                { label: "All tenants", href: "/tenants" },
                { label: "Inactive" },
              ]
            : [
                { label: "Overview", href: "/dashboard" },
                { label: "All tenants" },
              ]
        }
        actions={
          <ApexCreateTenantDialog />
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ApexPillTabs
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          tabs={[
            { value: "all", label: "All types", count: rows.length },
            { value: "main", label: "Companies", count: mains },
            { value: "branch", label: "Branches", count: rows.length - mains },
          ]}
        />
        <div className="flex shrink-0 items-center justify-end gap-2">
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            Status
          </span>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-10 w-46 rounded-xl border-white/10 bg-white/4">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              <SelectItem value="risk">Needs attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, TIN, or sales agent…"
          className="h-10 rounded-xl pl-9"
        />
      </div>

      {!loading && !inactiveOnly && visible.length > 0 ? (
        <ApexTenantSummary tenants={visible} total={rows.length} />
      ) : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={5} />
        ) : visible.length === 0 ? (
          <ApexEmptyState
            icon={Building2}
            title={rows.length === 0 ? "No tenants yet" : "No tenants match"}
            description={
              rows.length === 0
                ? "Create the first wholesaler to start tracking subscriptions and modules."
                : "Try a different tab, status, or search term."
            }
            action={
              rows.length === 0 ? (
                <ApexCreateTenantDialog>Create tenant</ApexCreateTenantDialog>
              ) : null
            }
          />
        ) : (
          <ApexDataTable
            data={visible}
            columns={columns}
            noun="tenants"
            pageSize={10}
            showToolbar={false}
          />
        )}
      </ApexPanel>
    </div>
  );
}
