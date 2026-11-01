"use client";

import * as React from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Receipt } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { dateLabel, useQueue } from "@/components/apex/platform/ApexQueuePage";
import { ApexDecisionActions } from "@/components/apex/platform/ApexDecisionActions";
import { DecisionStatusBadge } from "@/components/apex/StatusBadge";
import { money } from "@/lib/admin/api";
import {
  decideSubscription,
  fetchTenantPayments,
  type PaymentRow,
} from "@/lib/admin/platform";

export function PaymentsTab({
  tenantId,
  onChanged,
}: {
  tenantId: number;
  onChanged: () => void;
}) {
  const queue = useQueue(() => fetchTenantPayments(tenantId), [tenantId]);

  const columns = React.useMemo<LegacyColumnDef<PaymentRow, unknown>[]>(
    () => [
      {
        accessorKey: "transaction_ref",
        header: "Reference",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-mono text-xs">
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
        accessorKey: "covers_until",
        header: "Covers until",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateLabel(row.original.covers_until)}
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
              what="Payment"
              onDecide={async (decision, note) => {
                await decideSubscription(row.original.id, decision, note);
                queue.reload();
                onChanged();
              }}
            />
          ) : null,
      },
    ],
    [queue, onChanged],
  );

  return (
    <ApexPanel
      title="Payment history"
      description="Yearly subscription payments, newest first."
    >
      {queue.rows.length === 0 && !queue.loading ? (
        <ApexEmptyState
          icon={Receipt}
          title="No payments yet"
          description="Subscription payments submitted by the owner land here for verification."
        />
      ) : (
        <ApexDataTable
          data={queue.rows}
          columns={columns}
          noun="payments"
          pageSize={10}
          showToolbar={false}
        />
      )}
    </ApexPanel>
  );
}
