"use client";

import { useMemo, useState } from "react";
import { formatETB } from "@/lib/apex/analytics";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApexTenantTabShell } from "@/components/apex/tenant/ApexTenantTabShell";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import {
  approveYearly,
  approveSetup,
  rejectPayment,
  type TenantDetail,
} from "@/lib/apex/actions";

type Payment = TenantDetail["recentPayments"][number];

type Props = {
  tinNumber: string;
  payments: Payment[];
  busy: boolean;
  onChanged: () => void;
};

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "approved" || s === "paid") return <Badge variant="success">Approved</Badge>;
  if (s === "pending") return <Badge variant="warning">Pending</Badge>;
  if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return (
    <Badge variant="outline" className="capitalize">
      {status}
    </Badge>
  );
}

export function ApexTenantPaymentsTable({
  tinNumber,
  payments,
  busy,
  onChanged,
}: Props) {
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const pendingCount = payments.filter(
    (p) => String(p.status).toLowerCase() === "pending",
  ).length;

  const run = async (id: number, fn: () => Promise<void>) => {
    setActingId(id);
    try {
      await fn();
      toast.success("Payment updated");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActingId(null);
    }
  };

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paymentKind",
        header: "Kind",
        cell: ({ row }) => (
          <span className="capitalize font-medium">
            {row.original.paymentKind}
          </span>
        ),
      },
      {
        accessorKey: "amountETB",
        header: "Amount",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatETB(row.original.amountETB)}
          </span>
        ),
      },
      {
        accessorKey: "transactionRef",
        header: "Reference",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.transactionRef}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {new Date(row.original.submittedAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.status === "pending" ? (
              <div className="flex flex-col items-end gap-2">
                <Button
                  size="sm"
                  variant="success"
                  className="apex-row-action"
                  disabled={busy || actingId === row.original.id}
                  onClick={() =>
                    run(row.original.id, () =>
                      row.original.paymentKind === "setup"
                        ? approveSetup(tinNumber)
                        : approveYearly(tinNumber),
                    )
                  }
                >
                  Approve
                </Button>
                <div className="flex gap-1">
                  <Input
                    className="h-7 w-28 text-xs"
                    placeholder="Reject reason"
                    value={rejectReason[row.original.id] ?? ""}
                    onChange={(e) =>
                      setRejectReason((prev) => ({
                        ...prev,
                        [row.original.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="apex-row-action"
                    disabled={
                      busy ||
                      actingId === row.original.id ||
                      !rejectReason[row.original.id]?.trim()
                    }
                    onClick={() =>
                      run(row.original.id, () =>
                        rejectPayment(
                          row.original.id,
                          rejectReason[row.original.id] ?? "",
                        ),
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
    ],
    [actingId, busy, rejectReason, tinNumber],
  );

  return (
    <ApexTenantTabShell
      title="Payment history"
      description="Approve or reject pending submissions from this wholesaler."
      icon={Receipt}
      tone="gold"
      contentClassName="px-0 py-0"
      actions={
        pendingCount > 0 ? (
          <Badge variant="warning">{pendingCount} pending</Badge>
        ) : (
          <Badge variant="outline">{payments.length} total</Badge>
        )
      }
    >
      {payments.length === 0 ? (
        <div className="px-5 py-5 sm:px-6">
          <ApexEmptyState
            icon={Receipt}
            title="No payment submissions"
            description="Setup and renewal proofs will list here once submitted."
          />
        </div>
      ) : (
        <ApexDataTable
          data={payments}
          columns={columns}
          noun="payments"
          pageSize={10}
        />
      )}
    </ApexTenantTabShell>
  );
}
