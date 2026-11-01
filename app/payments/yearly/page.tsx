"use client";

import * as React from "react";
import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { CreditCard } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { ApexDecisionActions } from "@/components/apex/platform/ApexDecisionActions";
import { DecisionStatusBadge } from "@/components/apex/StatusBadge";
import { money } from "@/lib/admin/api";
import {
  decideSubscription,
  fetchSubscriptionLedger,
  type PaymentRow,
} from "@/lib/admin/platform";

export default function YearlyPaymentsPage() {
  const queue = useQueue(fetchSubscriptionLedger);
  const [filter, setFilter] = React.useState("PENDING");

  const rows = React.useMemo(
    () =>
      filter === "ALL"
        ? queue.rows
        : queue.rows.filter((r) => r.status === filter),
    [queue.rows, filter],
  );

  const columns = React.useMemo<LegacyColumnDef<PaymentRow, unknown>[]>(
    () => [
      {
        accessorKey: "tenant_name",
        header: "Tenant",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${row.original.tenant}`}
            className="font-medium hover:text-apex-emerald hover:underline"
          >
            {row.original.tenant_name}
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
              {row.original.channel} · {row.original.years} yr
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
        accessorKey: "paid_on",
        header: "Paid on",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateLabel(row.original.paid_on)}
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
              what="Subscription payment"
              onDecide={async (decision, note) => {
                await decideSubscription(row.original.id, decision, note);
                queue.reload();
              }}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.original.decided_by || ""}
            </span>
          ),
      },
    ],
    [queue],
  );

  const pending = queue.rows.filter((r) => r.status === "PENDING");

  return (
    <ApexQueuePage
      title="Yearly payments"
      description="Subscription renewals in the verification queue. Approving extends the tenant by one year per paid year."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Yearly payments" },
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
              value: money(
                queue.rows
                  .filter((r) => r.status === "APPROVED")
                  .reduce((sum, r) => sum + Number(r.amount), 0),
              ),
              tone: "sky",
            },
            { label: "Entries", value: queue.rows.length },
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
              icon={CreditCard}
              title="Nothing in this view"
              description="Payments submitted by owners appear here for approval."
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
