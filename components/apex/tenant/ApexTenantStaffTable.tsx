"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexTenantTabShell } from "@/components/apex/tenant/ApexTenantTabShell";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { isInternalLogin, type TenantDetail } from "@/lib/apex/actions";

type Props = {
  users: TenantDetail["users"];
  busy: boolean;
  onToggleLogin: (userId: number, wasDisabled: boolean) => void;
};

export function ApexTenantStaffTable({ users, busy, onToggleLogin }: Props) {
  const disabledCount = users.filter((u) => u.loginDisabled).length;
  const columns = useMemo<ColumnDef<TenantDetail["users"][number]>[]>(
    () => [
      {
        accessorKey: "UserName",
        header: "Staff",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{row.original.displayName}</p>
            {!isInternalLogin(row.original.UserName) ? (
              <p className="text-xs text-muted-foreground">
                {row.original.UserName}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "Role",
        header: "Role",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.Role}</span>
        ),
      },
      {
        accessorKey: "loginDisabled",
        header: "Login",
        cell: ({ row }) =>
          row.original.loginDisabled ? (
            <div className="space-y-0.5">
              <Badge variant="destructive">Disabled</Badge>
              {row.original.loginDisabledReason ? (
                <p className="max-w-56 text-[11px] text-muted-foreground wrap-break-word">
                  {row.original.loginDisabledReason}
                </p>
              ) : null}
            </div>
          ) : (
            <Badge variant="success">Active</Badge>
          ),
        sortingFn: (a, b) =>
          Number(a.original.loginDisabled) - Number(b.original.loginDisabled),
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              variant={row.original.loginDisabled ? "success" : "destructive"}
              className="apex-row-action"
              disabled={busy}
              onClick={() =>
                onToggleLogin(row.original.id, row.original.loginDisabled)
              }
            >
              {row.original.loginDisabled ? "Enable" : "Disable"}
            </Button>
          </div>
        ),
      },
    ],
    [busy, onToggleLogin],
  );

  return (
    <ApexTenantTabShell
      title="Staff accounts"
      description="Emergency per-user login disable — does not change roles or passwords."
      icon={Users}
      tone="emerald"
      contentClassName="px-0 py-0"
      actions={
        disabledCount > 0 ? (
          <Badge variant="destructive">{disabledCount} disabled</Badge>
        ) : (
          <Badge variant="success">All active</Badge>
        )
      }
    >
      {users.length === 0 ? (
        <div className="px-5 py-5 sm:px-6">
          <ApexEmptyState
            icon={Users}
            title="No staff accounts"
            description="Staff will appear here once created for this wholesaler."
          />
        </div>
      ) : (
        <ApexDataTable
          data={users}
          columns={columns}
          noun="staff accounts"
          pageSize={10}
        />
      )}
    </ApexTenantTabShell>
  );
}
