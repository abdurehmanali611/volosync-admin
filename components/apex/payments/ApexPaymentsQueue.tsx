"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatETB } from "@/lib/apex/analytics";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchPendingPayments,
  approveSetup,
  approveYearly,
  rejectPayment,
  invalidateApexCaches,
  type PaymentRow,
} from "@/lib/apex/actions";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexApproveRejectActions } from "@/components/apex/layout/ApexApproveRejectActions";
import { Badge } from "@/components/ui/badge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";

type PaymentKind = "setup" | "yearly";

const META: Record<
  PaymentKind,
  {
    title: string;
    description: string;
    icon: typeof UserPlus;
    badgeKey:
      | "pendingSetupPayments"
      | "pendingYearlyPayments"
      | "pendingYearlyPayments";
  }
> = {
  setup: {
    title: "Setup payments",
    description:
      "One-time setup fee submissions — verify references, then approve or reject each wholesaler.",
    icon: UserPlus,
    badgeKey: "pendingSetupPayments",
  },
  yearly: {
    title: "Yearly payments",
    description:
      "Wholesaler yearly subscriptions — verify references, then approve to extend paid-until.",
    icon: CreditCard,
    badgeKey: "pendingYearlyPayments",
  },
};

export function ApexPaymentsQueue({ kind }: { kind: PaymentKind }) {
  const meta = META[kind];
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const coordinator = useLoadCoordinator();
  const { refresh: refreshSummary, summary } = useApexDashboard();

  const load = useCallback((force = false) => {
    if (force) invalidateApexCaches(`apex:payments:${kind}`);
    void coordinator.run(async (isStale) => {
      setLoading(true);
      try {
        const data = await fetchPendingPayments(kind);
        if (!isStale()) setRows(data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load payments");
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [coordinator, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
      toast.success("Payment updated");
      load(true);
      void refreshSummary(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = summary?.[meta.badgeKey];
  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
            className="font-medium transition-colors hover:text-[oklch(0.82_0.04_85)]"
          >
            {row.original.hotelDisplayName ?? "—"}
          </Link>
        ),
      },
            {
        accessorKey: "tinNumber",
        header: "TIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.tinNumber}</span>
        ),
      },
      {
        accessorKey: "salesAgentName",
        header: "Sales agent",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.salesAgentName?.trim() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "amountETB",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatETB(row.original.amountETB)}
          </span>
        ),
      },
      {
        accessorKey: "paymentChannel",
        header: "Channel",
      },
      {
        accessorKey: "transactionRef",
        header: "Reference",
        cell: ({ row }) => (
          <span className="block max-w-40 truncate font-mono text-xs">
            {row.original.transactionRef}
          </span>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {new Date(row.original.submittedAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        minSize: 220,
        meta: { className: "whitespace-nowrap", headerClassName: "whitespace-nowrap" },
        cell: ({ row }) => (
          <div className="flex justify-end whitespace-nowrap">
            <ApexApproveRejectActions
              busy={busyId === row.original.id}
              rejectTitle={`Reject ${kind} payment`}
              onApprove={() =>
                act(row.original.id, () =>
                  kind === "setup"
                    ? approveSetup(row.original.tinNumber)
                    : approveYearly(row.original.tinNumber),
                )
              }
              onReject={(reason) =>
                act(row.original.id, () => rejectPayment(row.original.id, reason))
              }
            />
          </div>
        ),
      },
    ],
    [busyId, kind],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={meta.title}
        description={meta.description}
        actions={
          pendingCount != null && pendingCount > 0 ? (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          ) : null
        }
      />

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={meta.icon}
            title={`No pending ${kind} payments`}
            description="New submissions from tenants will appear here."
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="payments"
            pageSize={10}
            tableClassName="min-w-max"
          />
        )}
      </ApexPanel>
    </div>
  );
}
