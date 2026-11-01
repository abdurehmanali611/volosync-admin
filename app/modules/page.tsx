"use client";

import * as React from "react";
import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Puzzle, ShieldCheck } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { ApexDecisionActions } from "@/components/apex/platform/ApexDecisionActions";
import { DecisionStatusBadge } from "@/components/apex/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  decideModuleRequest,
  fetchModuleRequests,
  type ModuleRequestRow,
} from "@/lib/admin/platform";

/** Credentials is never a requestable candidate (basic layer, always on). */
const NON_REQUESTABLE = new Set(["CREDENTIALS"]);

export default function ModuleRequestsPage() {
  const queue = useQueue(fetchModuleRequests);
  const [filter, setFilter] = React.useState("PENDING");

  const rows = React.useMemo(
    () =>
      (filter === "ALL"
        ? queue.rows
        : queue.rows.filter((r) => r.status === filter)
      ).map((row) => ({
        ...row,
        modules: row.requested_modules
          .split(",")
          .map((m) => m.trim().toUpperCase())
          .filter((m) => m && !NON_REQUESTABLE.has(m)),
      })),
    [queue.rows, filter],
  );

  type Row = ModuleRequestRow & { modules: string[] };

  const columns = React.useMemo<LegacyColumnDef<Row, unknown>[]>(
    () => [
      {
        accessorKey: "tenant",
        header: "Tenant",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${row.original.tenant_id}`}
            className="font-medium hover:text-apex-emerald hover:underline"
          >
            {row.original.tenant}
          </Link>
        ),
      },
      {
        accessorKey: "modules",
        header: "Requested modules",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.modules.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              row.original.modules.map((code) => (
                <Badge
                  key={code}
                  variant="outline"
                  className="border-apex-teal/30 bg-apex-teal/10 text-[10px] font-semibold uppercase text-apex-teal"
                >
                  {code}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        accessorKey: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[220px] text-sm text-muted-foreground">
            {row.original.note || "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Requested",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateLabel(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <DecisionStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status === "PENDING" ? (
            <ApexDecisionActions
              what="Module request"
              onDecide={async (decision) => {
                await decideModuleRequest(row.original.id, decision);
                queue.reload();
              }}
            />
          ) : null,
      },
    ],
    [queue],
  );

  const pending = queue.rows.filter((r) => r.status === "PENDING");

  return (
    <ApexQueuePage
      title="Module requests"
      description="Wholesalers asking to switch on Inventory or HR. Approving enables the modules immediately."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Module requests" },
      ]}
      loading={queue.loading}
      error={queue.error}
      columns={6}
    >
      <div className="space-y-4">
        <ApexInfoBanner icon={ShieldCheck}>
          Credentials is included with every plan and can never be requested —
          only Inventory and HR appear as candidates.
        </ApexInfoBanner>
        <ApexQueueStats
          items={[
            { label: "Pending", value: pending.length, tone: "amber" },
            {
              label: "Approved",
              value: queue.rows.filter((r) => r.status === "APPROVED").length,
              tone: "emerald",
            },
            {
              label: "Rejected",
              value: queue.rows.filter((r) => r.status === "REJECTED").length,
              tone: "danger",
            },
            { label: "Total requests", value: queue.rows.length },
          ]}
        />
        <ApexPillTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "PENDING", label: "Pending", count: pending.length },
            {
              value: "APPROVED",
              label: "Approved",
              count: queue.rows.filter((r) => r.status === "APPROVED").length,
            },
            {
              value: "REJECTED",
              label: "Rejected",
              count: queue.rows.filter((r) => r.status === "REJECTED").length,
            },
            { value: "ALL", label: "All", count: queue.rows.length },
          ]}
        />
        <ApexPanel>
          {rows.length === 0 ? (
            <ApexEmptyState
              icon={Puzzle}
              title="No module requests here"
              description="Requests appear once a wholesaler asks for additional modules."
            />
          ) : (
            <ApexDataTable
              data={rows}
              columns={columns}
              noun="requests"
              pageSize={12}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>
    </ApexQueuePage>
  );
}
