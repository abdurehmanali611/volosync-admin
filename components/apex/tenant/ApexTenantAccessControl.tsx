"use client";

import { AlertTriangle, Ban, Pause, Shield, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ApexTenantTabShell } from "@/components/apex/tenant/ApexTenantTabShell";
import { AccountStatusBadge } from "@/components/apex/StatusBadge";
import type { TenantDetail } from "@/lib/apex/actions";

type Props = {
  tenant: TenantDetail;
  reason: string;
  busy: boolean;
  onReasonChange: (value: string) => void;
  onSuspend: () => void;
  onBan: () => void;
  onUnsuspend: () => void;
  onUnban: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

export function ApexTenantAccessControl({
  tenant,
  reason,
  busy,
  onReasonChange,
  onSuspend,
  onBan,
  onUnsuspend,
  onUnban,
  onDelete,
  onRestore,
}: Props) {
  const isActive = tenant.accountStatus === "active";
  const isSuspended = tenant.accountStatus === "suspended";
  const isBanned = tenant.accountStatus === "banned";
  const isDeleted = tenant.accountStatus === "deleted";

  const stateHint = isDeleted
    ? "Removed from active portfolio — no volosync logins. Restore to reactivate."
    : isActive
      ? "Wholesaler can sign in normally."
      : isSuspended
        ? "Temporarily locked — unsuspend to restore."
        : "Permanently blocked — unban to restore.";

  return (
    <ApexTenantTabShell
      title="Access control"
      description="Suspend, ban, delete, or restore this wholesaler — applies to all staff logins."
      icon={Shield}
      tone="rose"
      actions={<AccountStatusBadge status={tenant.accountStatus} />}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Current state
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-foreground">
              {tenant.accountStatus}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stateHint}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Recorded reasons
            </p>
            {tenant.suspendedReason && !isDeleted ? (
              <p className="text-sm text-muted-foreground">
                <Badge variant="warning" className="mr-2">
                  Suspended
                </Badge>
                {tenant.suspendedReason}
              </p>
            ) : null}
            {tenant.bannedReason && isBanned ? (
              <p className="text-sm text-muted-foreground">
                <Badge variant="destructive" className="mr-2">
                  Banned
                </Badge>
                {tenant.bannedReason}
              </p>
            ) : null}
            {tenant.bannedReason && isDeleted ? (
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  Deleted
                </Badge>
                {tenant.bannedReason}
              </p>
            ) : null}
            {!tenant.suspendedReason && !tenant.bannedReason ? (
              <p className="text-sm text-muted-foreground">No prior enforcement notes.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="access-reason">
            Reason
          </label>
          <Textarea
            id="access-reason"
            placeholder={
              isDeleted
                ? "Optional note when restoring"
                : "Required for suspend, ban, or delete — shown in audit history"
            }
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          {(isActive || isSuspended || isBanned) && !reason.trim() ? (
            <p className="flex items-center gap-1.5 text-xs text-[oklch(0.82_0.06_75)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Enter a reason before suspending, banning, or deleting.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {isDeleted ? (
            <Button
              size="sm"
              variant="success"
              className="apex-row-action gap-1.5"
              disabled={busy}
              onClick={onRestore}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Restore tenant
            </Button>
          ) : isActive ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onSuspend}
              >
                <Pause className="h-3.5 w-3.5" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onBan}
              >
                <Ban className="h-3.5 w-3.5" />
                Ban wholesaler
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete tenant
              </Button>
            </>
          ) : isSuspended ? (
            <>
              <Button
                size="sm"
                variant="success"
                className="apex-row-action gap-1.5"
                disabled={busy}
                onClick={onUnsuspend}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Unsuspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete tenant
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="success"
                className="apex-row-action gap-1.5"
                disabled={busy}
                onClick={onUnban}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Unban
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete tenant
              </Button>
            </>
          )}
        </div>
      </div>
    </ApexTenantTabShell>
  );
}
