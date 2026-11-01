"use client";

import * as React from "react";
import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { KeyRound, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateTimeLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { RoleBadge } from "@/components/apex/platform/RoleBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton } from "@/components/ui/pending-button";
import { mapApiError } from "@/lib/admin/core";
import {
  fetchAllStaff,
  resetPassword,
  type StaffRow,
} from "@/lib/admin/platform";

const ROLES = ["ALL", "OWNER", "MANAGER", "FINANCE", "HR", "SALES", "STORE"];

export default function UsersPage() {
  const queue = useQueue(fetchAllStaff);
  const [role, setRole] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [target, setTarget] = React.useState<StaffRow | null>(null);
  const [password, setPassword] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const rows = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return queue.rows.filter((row) => {
      if (role !== "ALL" && row.role !== role) return false;
      if (!term) return true;
      return (
        row.username.toLowerCase().includes(term) ||
        row.name.toLowerCase().includes(term) ||
        (row.tenant ?? "").toLowerCase().includes(term)
      );
    });
  }, [queue.rows, role, query]);

  const reset = async () => {
    if (!target) return;
    if (password && password.length < 6) {
      toast.error("Use at least 6 characters, or leave empty to generate.");
      return;
    }
    setPending(true);
    try {
      const out = await resetPassword(target.id, password || undefined);
      setResult(out.password);
      toast.success("Password reset — shown once");
    } catch (e) {
      toast.error(mapApiError(e, "Could not reset the password."));
    } finally {
      setPending(false);
    }
  };

  const closeDialog = () => {
    setTarget(null);
    setPassword("");
    setResult(null);
  };

  const columns = React.useMemo<LegacyColumnDef<StaffRow, unknown>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Account",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              @{row.original.username}
            </p>
          </div>
        ),
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) =>
          row.original.tenant_id ? (
            <Link
              href={`/tenants/${row.original.tenant_id}`}
              className="text-sm hover:text-apex-emerald hover:underline"
            >
              {row.original.tenant || "—"}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "last_login",
        header: "Last login",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateTimeLabel(row.original.last_login)}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={
              row.original.is_active
                ? "text-muted-foreground"
                : "text-apex-amber"
            }
          >
            {row.original.is_active ? "Active" : "Suspended"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setTarget(row.original)}
          >
            <KeyRound className="mr-1.5 size-3.5" /> Reset
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <ApexQueuePage
      title="Tenant users"
      description="Every login across all wholesalers, with role and credential state."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Tenant users" },
      ]}
      loading={queue.loading}
      error={queue.error}
      columns={6}
    >
      <div className="space-y-4">
        <ApexInfoBanner icon={KeyRound}>
          A reset sets a new password; it is shown once and can never be
          retrieved again. Users can change their own password at any time.
        </ApexInfoBanner>
        <ApexQueueStats
          items={[
            { label: "Accounts", value: queue.rows.length, tone: "emerald" },
            {
              label: "Owners",
              value: queue.rows.filter((r) => r.role === "OWNER").length,
              tone: "sky",
            },
            {
              label: "Suspended",
              value: queue.rows.filter((r) => !r.is_active).length,
              tone: "amber",
            },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ApexPillTabs
            value={role}
            onChange={setRole}
            tabs={ROLES.map((value) => ({
              value,
              label: value === "ALL" ? "All roles" : value,
              count:
                value === "ALL"
                  ? queue.rows.length
                  : queue.rows.filter((r) => r.role === value).length,
            }))}
          />
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user or tenant"
              className="h-9 pl-9"
            />
          </div>
        </div>
        <ApexPanel>
          {rows.length === 0 ? (
            <ApexEmptyState
              icon={Users}
              title="No accounts match"
              description="Adjust the role filter or clear the search."
            />
          ) : (
            <ApexDataTable
              data={rows}
              columns={columns}
              noun="users"
              pageSize={12}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>

      <Dialog
        open={target !== null}
        onOpenChange={(next) => (next ? null : closeDialog())}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {target
                ? `@${target.username} · ${target.tenant || "platform"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password (optional)</Label>
            <Input
              id="reset-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to generate"
              autoComplete="new-password"
            />
            {result ? (
              <ApexInfoBanner icon={KeyRound}>
                New password: <span className="font-mono">{result}</span>
              </ApexInfoBanner>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={closeDialog}
              className="cursor-pointer"
            >
              {result ? "Done" : "Cancel"}
            </Button>
            <PendingButton
              pending={pending}
              onClick={reset}
              className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
            >
              {pending ? "Resetting" : "Reset password"}
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ApexQueuePage>
  );
}
