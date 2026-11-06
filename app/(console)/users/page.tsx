"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchTenantUsers,
  fetchTenants,
  type TenantListItem,
  type TenantUserMonitoringRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/components/apex/layout/ApexSearchInput";
import {
  ApexTenantUsersDetailTrigger,
  tenantStandingLabel,
  tenantUsersMetaLine,
  type TenantUsersGroup,
} from "@/components/apex/tenant/ApexTenantUsersDetailTrigger";
import { Badge } from "@/components/ui/badge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

function groupUsersByTenant(
  users: TenantUserMonitoringRow[],
  tenantsByTin: Map<string, TenantListItem>,
): TenantUsersGroup[] {
  const byTin = new Map<string, TenantUserMonitoringRow[]>();
  for (const user of users) {
    const tin = String(user.tinNumber).trim();
    if (!tin) continue;
    const list = byTin.get(tin);
    if (list) list.push(user);
    else byTin.set(tin, [user]);
  }

  const groups: TenantUsersGroup[] = [];
  for (const [tinNumber, groupUsers] of byTin) {
    const tenant = tenantsByTin.get(tinNumber);
    const roles = [
      ...new Set(
        groupUsers.map((u) => String(u.role || "").trim()).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const standingLabel = tenantStandingLabel({
      accountStatus: tenant?.accountStatus,
      subscriptionStatus: tenant?.subscriptionStatus,
      isIllustrationTenant: tenant?.isIllustrationTenant,
    });
    groups.push({
      tinNumber,
      hotelDisplayName:
        tenant?.hotelDisplayName ||
        groupUsers[0]?.hotelDisplayName ||
        tinNumber,
      businessType: tenant?.businessType || groupUsers[0]?.businessType || "",
      roleCount: roles.length,
      roles,
      userCount: groupUsers.length,
      disabledCount: groupUsers.filter((u) => u.loginDisabled).length,
      pays: standingLabel === "Pays",
      standingLabel,
      subscriptionStatus: tenant?.subscriptionStatus ?? null,
      accountStatus: tenant?.accountStatus ?? null,
      isIllustrationTenant: Boolean(tenant?.isIllustrationTenant),
      users: groupUsers,
    });
  }

  return groups.sort((a, b) =>
    a.hotelDisplayName.localeCompare(b.hotelDisplayName, undefined, {
      sensitivity: "base",
    }),
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading users…" />}>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type") || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [groups, setGroups] = useState<TenantUsersGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const [list, tenants] = await Promise.all([
          fetchTenantUsers(
            debouncedSearch || undefined,
            typeFilter !== "all" ? typeFilter : undefined,
            { limit: 500 },
          ),
          fetchTenants(
            undefined,
            typeFilter !== "all" ? typeFilter : undefined,
          ),
        ]);
        const tenantsByTin = new Map(
          tenants.map((t) => [String(t.tinNumber).trim(), t] as const),
        );
        const next = groupUsersByTenant(list, tenantsByTin);
        if (!isStale()) setGroups(next);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load users");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [debouncedSearch, typeFilter, coordinator]);

  const columns = useMemo<ColumnDef<TenantUsersGroup>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Tenant",
        cell: ({ row }) => (
          <ApexTenantUsersDetailTrigger
            group={row.original}
            className="px-1 py-0.5 -mx-1"
          >
            <div className="flex max-w-xs flex-col gap-0.5">
              <span className="font-medium wrap-break-word underline-offset-2 group-hover/detail:underline">
                {row.original.hotelDisplayName}
              </span>
              <span className="text-[10px] leading-snug text-muted-foreground wrap-break-word">
                {tenantUsersMetaLine(row.original)}
              </span>
            </div>
          </ApexTenantUsersDetailTrigger>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {row.original.userCount}
          </span>
        ),
      },
      {
        accessorKey: "disabledCount",
        header: "Login",
        cell: ({ row }) =>
          row.original.disabledCount > 0 ? (
            <Badge variant="destructive">
              {row.original.disabledCount} disabled
            </Badge>
          ) : (
            <Badge variant="success">All active</Badge>
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
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Tenant users"
        description="Staff accounts grouped by wholesaler"
      />

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search username, wholesaler, TIN…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={4} />
        ) : groups.length === 0 ? (
          <ApexEmptyState
            icon={Users}
            title="No users found"
            description={
              debouncedSearch
                ? "Try a different search term."
                : "No accounts match this filter."
            }
          />
        ) : (
          <ApexDataTable
            data={groups}
            columns={columns}
            noun="wholesalers"
            pageSize={10}
          />
        )}
      </ApexPanel>
    </div>
  );
}
