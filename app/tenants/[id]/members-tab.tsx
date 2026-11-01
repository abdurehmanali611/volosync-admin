"use client";

import * as React from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Users } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueueStats,
  dateTimeLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { RoleBadge } from "@/components/apex/platform/RoleBadge";
import {
  fetchBranches,
  fetchTenantStaff,
  type BranchRow,
  type StaffRow,
} from "@/lib/admin/platform";
import { money } from "@/lib/admin/api";
import Link from "next/link";

export function MembersTab({ tenantId }: { tenantId: number }) {
  const staff = useQueue(() => fetchTenantStaff(tenantId), [tenantId]);
  const branches = useQueue(() => fetchBranches(tenantId), [tenantId]);

  const columns = React.useMemo<LegacyColumnDef<StaffRow, unknown>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Account",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              @{row.original.username}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "last_login",
        header: "Last login",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateTimeLabel(row.original.last_login)}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={
              row.original.is_active
                ? "text-muted-foreground"
                : "text-apex-amber"
            }
          >
            {row.original.is_active ? "Active" : "Suspended"}
          </span>
        ),
      },
    ],
    [],
  );

  const branchColumns = React.useMemo<LegacyColumnDef<BranchRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Branch",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${row.original.id}`}
            className="font-medium hover:text-apex-emerald hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "tin",
        header: "TIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.tin}
          </span>
        ),
      },
      {
        accessorKey: "annual_fee",
        header: "Annual fee",
        cell: ({ row }) => (
          <span className="tabular-nums">{money(row.original.annual_fee)}</span>
        ),
      },
      {
        accessorKey: "staff_count",
        header: "Staff",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.staff_count}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <ApexQueueStats
        items={[
          { label: "Accounts", value: staff.rows.length, tone: "emerald" },
          {
            label: "Suspended",
            value: staff.rows.filter((row) => !row.is_active).length,
            tone: "amber",
          },
          { label: "Branches", value: branches.rows.length, tone: "sky" },
        ]}
      />

      <ApexPanel
        title="Members"
        description="Every login attached to this tenant."
      >
        {staff.rows.length === 0 && !staff.loading ? (
          <ApexEmptyState
            icon={Users}
            title="No members yet"
            description="Accounts appear here once the owner adds staff in their portal."
          />
        ) : (
          <ApexDataTable
            data={staff.rows}
            columns={columns}
            noun="members"
            pageSize={10}
            showToolbar={false}
          />
        )}
      </ApexPanel>

      <ApexPanel
        title="Branches"
        description="Child locations inheriting this company's settings."
      >
        {branches.rows.length === 0 && !branches.loading ? (
          <ApexEmptyState
            icon={Users}
            title="Single location"
            description="No branches have been created for this wholesaler."
          />
        ) : (
          <ApexDataTable
            data={branches.rows}
            columns={branchColumns}
            noun="branches"
            pageSize={8}
            showToolbar={false}
          />
        )}
      </ApexPanel>
    </div>
  );
}
