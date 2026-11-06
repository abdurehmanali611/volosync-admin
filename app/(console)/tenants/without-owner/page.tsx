"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchTenantsWithoutOwner,
  type TenantWithoutOwnerRow,
} from "@/lib/apex/actions";
import { ApexCreateTenantOwnerDialog } from "@/components/apex/onboarding/ApexCreateTenantOwnerDialog";
import { tenantPrimaryRole } from "@/lib/signup/subscriptionModules";
import type { BusinessType } from "@/constants/signup";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { businessTypeLabel } from "@/constants/businessTypes";
import { ApexCreateTenantTrigger } from "@/components/apex/onboarding/ApexCreateTenantTrigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function TenantsWithoutOwnerPage() {
  const [rows, setRows] = useState<TenantWithoutOwnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TenantWithoutOwnerRow | null>(null);
  const coordinator = useLoadCoordinator();

  const columns = useMemo<ColumnDef<TenantWithoutOwnerRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.hotelDisplayName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.tinNumber}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "businessType",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm">
            {businessTypeLabel(row.original.businessType)}
          </span>
        ),
      },
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) =>
          row.original.hasStaffUsers ? (
            <Badge variant="secondary">Has staff users</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">No staff yet</span>
          ),
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              variant="apex"
              onClick={() => setSelected(row.original)}
            >
              Create{" "}
              {tenantPrimaryRole(
                (row.original.businessType ?? "Company") as BusinessType,
              )}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const load = () => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchTenantsWithoutOwner();
        if (!isStale()) setRows(list);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load wholesalers");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  };

  useEffect(() => {
    load();
  }, [coordinator]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Wholesalers without Admin/Manager"
        description="Tenant accounts that exist but have no Admin or Manager login yet."
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: "Missing Admin/Manager" },
        ]}
        actions={
          <ApexCreateTenantTrigger size="sm" variant="apex">
            <UserPlus className="mr-2 h-4 w-4" />
            Create new tenant
          </ApexCreateTenantTrigger>
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={5} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={Building2}
            title="All wholesalers have Admin or Manager logins"
            description="When a tenant account exists without an Admin or Manager user, it will appear here."
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="wholesalers"
            pageSize={10}
          />
        )}
      </ApexPanel>

      {selected ? (
        <ApexCreateTenantOwnerDialog
          tenant={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          onCreated={load}
        />
      ) : null}
    </div>
  );
}
