"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, GitBranch, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatETB } from "@/lib/apex/analytics";
import {
  decideBranchPayment,
  fetchBranchPayments,
  invalidateApexCaches,
  type BranchPaymentRow,
} from "@/lib/apex/actions";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Multi-branch yearly renewals: one owner request carries several branch
 * lines. Apex either approves every line, approves while excluding some
 * (the excluded lines stay unpaid and can be resubmitted), or declines.
 */
export function ApexBranchPaymentsPanel() {
  const [rows, setRows] = useState<BranchPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<Record<number, Set<number>>>({});

  const load = useCallback((force = false) => {
    if (force) invalidateApexCaches("apex:branch-payments");
    setLoading(true);
    fetchBranchPayments({ status: "PENDING" })
      .then((data) => {
        setRows(data);
        setExcluded((prev) => {
          const next: Record<number, Set<number>> = {};
          for (const row of data) next[row.id] = prev[row.id] ?? new Set();
          return next;
        });
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to load branch payments"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (requestId: number, lineId: number) => {
    setExcluded((prev) => {
      const next = { ...prev };
      const set = new Set(next[requestId] ?? []);
      if (set.has(lineId)) set.delete(lineId);
      else set.add(lineId);
      next[requestId] = set;
      return next;
    });
  };

  const decide = async (
    row: BranchPaymentRow,
    decision: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED",
    note = "",
  ) => {
    setBusyId(row.id);
    try {
      const dropped = Array.from(excluded[row.id] ?? []);
      await decideBranchPayment(row.id, decision, {
        excludedLineIds: decision === "PARTIALLY_APPROVED" ? dropped : undefined,
        note,
      });
      toast.success(
        decision === "REJECTED"
          ? "Renewal declined"
          : decision === "PARTIALLY_APPROVED"
            ? `${row.includedCount - dropped.length} branches renewed`
            : `${row.includedCount} branches renewed`,
      );
      load(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ApexPanel>
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GitBranch className="size-4 text-[var(--apex-teal)]" />
          Multi-branch yearly renewals
        </div>
        <Badge variant="secondary">{rows.length} pending</Badge>
      </div>

      {loading ? (
        <ApexTableSkeleton cols={4} />
      ) : rows.length === 0 ? (
        <ApexEmptyState
          icon={GitBranch}
          title="No multi-branch renewals"
          description="Owner payments covering several branches appear here."
        />
      ) : (
        <div className="divide-y divide-border/30">
          {rows.map((row) => {
            const dropped = excluded[row.id] ?? new Set<number>();
            const included = row.branches.filter((line) => !dropped.has(line.lineId));
            const includedTotal = included.reduce((sum, line) => sum + line.amountETB, 0);
            const busy = busyId === row.id;
            return (
              <div key={row.id} className="space-y-4 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      <Link
                        href={`/tenants/${encodeURIComponent(row.parentTin)}`}
                        className="transition-colors hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {row.parentName}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {row.parentTin}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.channel} · {row.transactionRef} · {row.years} year
                      {row.years === 1 ? "" : "s"} · {row.branches.length} branch
                      {row.branches.length === 1 ? "" : "es"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </p>
                    <p className="font-medium tabular-nums">{formatETB(row.amountETB)}</p>
                    {dropped.size > 0 ? (
                      <p className="text-xs text-amber-300">
                        Approving {formatETB(includedTotal)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {row.branches.map((line) => {
                    const isDropped = dropped.has(line.lineId);
                    return (
                      <label
                        key={line.lineId}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                          isDropped
                            ? "border-rose-400/30 bg-rose-400/5 text-muted-foreground line-through"
                            : "border-border/60",
                        )}
                      >
                        <Checkbox
                          checked={!isDropped}
                          onCheckedChange={() => toggle(row.id, line.lineId)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {line.name}
                            {line.isMain ? (
                              <Badge variant="default" className="ml-2">
                                Main
                              </Badge>
                            ) : null}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {line.tinNumber} · {formatETB(line.amountETB)}
                            {isDropped ? " · excluded" : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busy || included.length === 0 || dropped.size > 0}
                    onClick={() => void decide(row, "APPROVED")}
                  >
                    {busy ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 size-3.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400/30 text-amber-300 hover:bg-amber-400/10 hover:text-amber-200"
                    disabled={busy || dropped.size === 0 || included.length === 0}
                    onClick={() => void decide(row, "PARTIALLY_APPROVED")}
                  >
                    Approve with excluding ({dropped.size})
                  </Button>
                  <DeclineButton
                    disabled={busy}
                    onDecline={(reason) => decide(row, "REJECTED", reason)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ApexPanel>
  );
}

function DeclineButton({
  disabled,
  onDecline,
}: {
  disabled: boolean;
  onDecline: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setWorking(true);
    try {
      await onDecline(reason.trim());
      setReason("");
      setOpen(false);
    } finally {
      setWorking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="mr-1.5 size-3.5" />
          Decline
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="apex-glass-card border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle>Decline this multi-branch renewal</AlertDialogTitle>
          <AlertDialogDescription>
            Every branch line stays unpaid. The owner sees this reason and can resubmit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this renewal is being declined…"
          rows={3}
          className="resize-none bg-background/80"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!reason.trim() || working}
            onClick={() => void submit()}
          >
            {working ? <Loader2 className="size-4 animate-spin" /> : "Confirm decline"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
