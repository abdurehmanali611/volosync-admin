"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { formatETB } from "@/lib/apex/analytics";
import {
  decideBranchRequest,
  fetchBranchRequests,
  invalidateApexCaches,
  type BranchRequestRow,
} from "@/lib/apex/actions";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexApproveRejectActions } from "@/components/apex/layout/ApexApproveRejectActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Filter = "PENDING" | "APPROVED" | "REJECTED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

function statusTone(status: string) {
  if (status === "approved") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (status === "rejected") return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  return "border-amber-400/30 bg-amber-400/10 text-amber-300";
}

export function ApexBranchRequestsQueue() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [rows, setRows] = useState<BranchRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    (force = false) => {
      if (force) invalidateApexCaches("apex:branch-requests");
      setLoading(true);
      fetchBranchRequests({ status: filter })
        .then(setRows)
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Failed to load requests"),
        )
        .finally(() => setLoading(false));
    },
    [filter],
  );

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, fn: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(message);
      load(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<BranchRequestRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Branch",
        cell: ({ row }) => (
          <div className="min-w-40">
            <p className="font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              TIN {row.original.tinNumber}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "parentName",
        header: "Company",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${encodeURIComponent(row.original.parentTin)}`}
            className="font-medium transition-colors hover:text-[oklch(0.82_0.04_85)]"
          >
            {row.original.parentName}
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              {row.original.parentTin}
            </span>
          </Link>
        ),
      },
      {
        accessorKey: "managerUsername",
        header: "Manager",
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{row.original.managerName || "—"}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.managerUsername || "no login"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "setupAmountETB",
        header: "Setup receipt",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="tabular-nums">{formatETB(row.original.setupAmountETB)}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.setupChannel} · {row.original.setupTransactionRef || "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleString()
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge className={cn("capitalize", statusTone(row.original.status))}>
              {row.original.status}
            </Badge>
            {row.original.status === "rejected" && row.original.decisionNote ? (
              <p className="max-w-48 text-xs text-rose-300/90">
                {row.original.decisionNote}
              </p>
            ) : null}
            {row.original.status === "approved" && row.original.createdBranchTin ? (
              <Link
                href={`/tenants/${encodeURIComponent(row.original.createdBranchTin)}`}
                className="text-xs text-emerald-300 underline-offset-4 hover:underline"
              >
                Open branch
              </Link>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        minSize: 200,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <div className="flex justify-end">
              <ApexApproveRejectActions
                busy={busyId === row.original.id}
                approveLabel="Approve branch"
                rejectLabel="Decline"
                rejectTitle={`Decline ${row.original.name}`}
                rejectDescription="The owner sees this reason in their Branches tab."
                onApprove={() =>
                  act(
                    row.original.id,
                    () => decideBranchRequest(row.original.id, "APPROVED"),
                    `${row.original.name} approved and created`,
                  )
                }
                onReject={(reason) =>
                  act(
                    row.original.id,
                    () => decideBranchRequest(row.original.id, "REJECTED", reason),
                    `${row.original.name} declined`,
                  )
                }
              />
            </div>
          ) : (
            <div className="text-right text-xs text-muted-foreground">
              {row.original.decidedBy || "—"}
            </div>
          ),
      },
    ],
    [busyId],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Branch requests"
        description="Owner-filed branches waiting on Apex. Approving creates the tenant, activates the manager login, and records the attached setup receipt."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={filter === item.key ? "secondary" : "ghost"}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={GitBranch}
            title={`No ${filter.toLowerCase()} branch requests`}
            description="Owner branch submissions will appear here for review."
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="branch requests"
            pageSize={10}
            tableClassName="min-w-max"
          />
        )}
      </ApexPanel>
    </div>
  );
}
