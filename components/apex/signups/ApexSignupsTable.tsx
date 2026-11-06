"use client";

import { useMemo, useState } from "react";
import { formatETB } from "@/lib/apex/analytics";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexApproveRejectActions } from "@/components/apex/layout/ApexApproveRejectActions";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { businessTypeLabel } from "@/constants/businessTypes";
import {
  approveSetup,
  rejectSetup,
  type MonthlySignupRow,
  type SignupReviewStatus,
} from "@/lib/apex/actions";

type StatusFilter = SignupReviewStatus | "all";

type Props = {
  rows: MonthlySignupRow[];
  onChanged: () => void;
};

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

function SignupStatusPill({ status }: { status: SignupReviewStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200">
        <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_0_3px_rgba(251,113,133,0.14)]" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.14)]" />
      Pending
    </span>
  );
}

function currentMonthLabel() {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function ApexSignupsTable({ rows, onChanged }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busyTin, setBusyTin] = useState<string | null>(null);

  const tabItems = useMemo(
    () => [
      {
        value: "all" as const,
        label: "All",
        count: rows.length,
      },
      {
        value: "pending" as const,
        label: "Pending",
        count: rows.filter((row) => row.status === "pending").length,
      },
      {
        value: "approved" as const,
        label: "Approved",
        count: rows.filter((row) => row.status === "approved").length,
      },
      {
        value: "rejected" as const,
        label: "Rejected",
        count: rows.filter((row) => row.status === "rejected").length,
      },
    ],
    [rows],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const snapshot = useMemo(() => {
    const pending = rows.filter((row) => row.status === "pending").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const rejected = rows.filter((row) => row.status === "rejected").length;
    return { pending, approved, rejected };
  }, [rows]);

  const runAction = async (
    tin: string,
    fn: () => Promise<void>,
    successMsg: string,
  ) => {
    setBusyTin(tin);
    try {
      await fn();
      toast.success(successMsg);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyTin(null);
    }
  };

  const columns = useMemo<ColumnDef<MonthlySignupRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
              className="font-medium hover:text-primary"
            >
              {row.original.hotelDisplayName}
            </Link>
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
        accessorKey: "ownerUserName",
        header: "Admin / Manager",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.ownerUserName}</span>
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
        accessorKey: "setupFeeETB",
        header: "Setup fee",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {formatETB(row.original.setupFeeETB)}
          </span>
        ),
      },
      {
        accessorKey: "paymentTransactionRef",
        header: "Payment ref",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.original.paymentTransactionRef || "—"}
            {row.original.paymentChannel ? (
              <span className="block text-muted-foreground">
                {row.original.paymentChannel}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        minSize: 110,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => <SignupStatusPill status={row.original.status} />,
      },
      {
        accessorKey: "registeredAt",
        header: "Registered",
        cell: ({ row }) => {
          const waitMins = Math.floor(
            (Date.now() - new Date(row.original.registeredAt).getTime()) / 60000,
          );
          return (
            <div className="text-sm text-muted-foreground">
              {new Date(row.original.registeredAt).toLocaleString()}
              {row.original.status === "pending" ? (
                <Badge
                  variant={waitMins > 45 ? "warning" : "secondary"}
                  className="mt-1.5 block w-fit text-[10px]"
                >
                  Waiting {waitMins} min
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        minSize: 220,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          if (row.original.status !== "pending") {
            return (
              <div className="text-right text-xs text-muted-foreground">—</div>
            );
          }
          const canReview =
            row.original.pendingSetupPaymentId != null ||
            Boolean(row.original.paymentTransactionRef);
          if (!canReview) {
            return (
              <div className="text-right text-xs text-muted-foreground">
                Awaiting payment
              </div>
            );
          }
          const isBusy = busyTin === row.original.tinNumber;
          return (
            <div className="flex justify-end whitespace-nowrap">
              <ApexApproveRejectActions
                busy={isBusy}
                approveLabel="Approve setup"
                rejectTitle="Reject setup payment"
                rejectDescription="The wholesaler owner will need to resubmit payment with a corrected reference."
                onApprove={() =>
                  void runAction(
                    row.original.tinNumber,
                    () => approveSetup(row.original.tinNumber),
                    "Setup approved — tenant can log in",
                  )
                }
                onReject={(reason) =>
                  void runAction(
                    row.original.tinNumber,
                    () => rejectSetup(row.original.tinNumber, reason),
                    "Setup rejected",
                  )
                }
              />
            </div>
          );
        },
      },
    ],
    // runAction closes over onChanged / busyTin; rebuild when those change
    [busyTin, onChanged],
  );

  return (
    <div className="space-y-5">
      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2.5 rounded-none border-0 bg-transparent p-0 pl-4 shadow-none sm:pl-5">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="apex-tabs-trigger h-11 flex-none gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-left leading-none shadow-sm transition-all duration-150 hover:border-white/12 hover:bg-white/4.5 data-[state=active]:border-[oklch(0.68_0.05_85/0.28)] data-[state=active]:bg-[oklch(0.24_0.014_265)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_8px_20px_-12px_oklch(0.88_0.06_85/0.45)]"
            >
              <span className="text-sm font-medium tracking-tight">{tab.label}</span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground dark:bg-white/10">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
            <UserPlus className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Signup snapshot
              </p>
              <Badge variant="secondary">{currentMonthLabel()}</Badge>
              <Badge variant="outline">
                {statusFilter === "all"
                  ? "All statuses"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Wholesalers that signed up this month — review pending setup fees,
              then track approved and rejected outcomes.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
              Pending review
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.pending}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Waiting for Apex action
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/14 bg-emerald-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/80">
              Approved
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.approved}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Setup fee cleared this month
            </p>
          </div>
          <div className="rounded-xl border border-rose-500/14 bg-rose-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-200/80">
              Rejected
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.rejected}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Need a corrected payment resubmit
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No signups</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {statusFilter === "pending"
              ? "No pending setup reviews for this month right now."
              : statusFilter === "all"
                ? "No wholesalers signed up this month yet."
                : "No signups match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-background/40">
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="signups"
            pageSize={10}
            tableClassName="min-w-max"
            showToolbar
            searchPlaceholder="Search business, TIN, owner…"
            rowClassName="hover:bg-white/3"
          />
        </div>
      )}
    </div>
  );
}
