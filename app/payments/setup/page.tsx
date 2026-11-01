"use client";

import * as React from "react";
import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Wallet } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateTimeLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { ApexDecisionActions } from "@/components/apex/platform/ApexDecisionActions";
import { DecisionStatusBadge } from "@/components/apex/StatusBadge";
import { money } from "@/lib/admin/api";
import {
  decideSetupPayment,
  fetchSetupPayments,
  type SetupPaymentRow,
} from "@/lib/admin/platform";

export default function SetupPaymentsPage() {
  const queue = useQueue(fetchSetupPayments);
  const [filter, setFilter] = React.useState("PENDING");

  const rows = React.useMemo(
    () =>
      filter === "ALL"
        ? queue.rows
        : queue.rows.filter((r) => r.status === filter),
    [queue.rows, filter],
  );

  const columns = React.useMemo<LegacyColumnDef<SetupPaymentRow, unknown>[]>(
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
        accessorKey: "transaction_ref",
        header: "Reference",
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs">
              {row.original.transaction_ref || "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.channel}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="tabular-nums">{money(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateTimeLabel(row.original.created_at)}
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
              what="Setup payment"
              onDecide={async (decision, note) => {
                await decideSetupPayment(row.original.id, decision, note);
                queue.reload();
              }}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.original.decided_by ? `by ${row.original.decided_by}` : ""}
            </span>
          ),
      },
    ],
    [queue],
  );

  const pending = queue.rows.filter((r) => r.status === "PENDING");

  return (
    <ApexQueuePage
      title="Setup payments"
      description="Onboarding fees wholesalers submit at signup. Approving records the fee — it does not activate the tenant."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Setup payments" },
      ]}
      loading={queue.loading}
      error={queue.error}
      columns={6}
    >
      <div className="space-y-4">
        <ApexQueueStats
          items={[
            { label: "Pending", value: pending.length, tone: "amber" },
            {
              label: "Pending value",
              value: money(
                pending.reduce((sum, r) => sum + Number(r.amount), 0),
              ),
              tone: "emerald",
            },
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
              icon={Wallet}
              title="Queue is clear"
              description="No setup payments match this filter right now."
            />
          ) : (
            <ApexDataTable
              data={rows}
              columns={columns}
              noun="payments"
              pageSize={12}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>
    </ApexQueuePage>
  );
}
