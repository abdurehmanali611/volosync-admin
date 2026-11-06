"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  FileText,
  Shield,
  UserRound,
} from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditLogRow } from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

type AuditCategory = "all" | "billing" | "access" | "modules" | "pricing" | "other";

type Props = {
  rows: AuditLogRow[];
};

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

const BILLING_ACTIONS = new Set([
  "approve_setup",
  "reject_setup",
  "reject_payment",
  "approve_yearly",
  "release_billing_hold",
  "update_tenant_billing",
  "apply_catalog_fees",
]);

const ACCESS_ACTIONS = new Set([
  "suspend_tenant",
  "unsuspend_tenant",
  "ban_tenant",
  "unban_tenant",
  "disable_user_login",
  "enable_user_login",
]);

const MODULE_ACTIONS = new Set([
  "update_tenant_modules",
  "sync_staff_modules",
  "approve_module_change",
  "reject_module_change",
]);

const PRICING_ACTIONS = new Set([
  "upsert_pricing_rule",
  "set_pricing_rule_active",
  "delete_pricing_rule",
]);

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

function categorizeAction(action: string): Exclude<AuditCategory, "all"> {
  if (BILLING_ACTIONS.has(action)) return "billing";
  if (ACCESS_ACTIONS.has(action)) return "access";
  if (MODULE_ACTIONS.has(action)) return "modules";
  if (PRICING_ACTIONS.has(action)) return "pricing";
  return "other";
}

function formatWhen(value: string) {
  try {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { day: value, time: "" };
  }
}

function memberInitials(name: string | null) {
  if (!name?.trim()) return "AP";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AP";
}

function ActionPill({ action }: { action: string }) {
  const category = categorizeAction(action);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-xs font-semibold capitalize wrap-break-word whitespace-normal",
        category === "billing" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        category === "access" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-100",
        category === "modules" &&
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
        category === "pricing" &&
          "border-teal-500/20 bg-teal-500/10 text-teal-100",
        category === "other" &&
          "border-white/10 bg-white/5 text-muted-foreground",
      )}
      title={formatAction(action)}
    >
      {formatAction(action)}
    </span>
  );
}

export function ApexAuditLogTable({ rows }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory>("all");

  const tabItems = useMemo(() => {
    const counts = {
      all: rows.length,
      billing: 0,
      access: 0,
      modules: 0,
      pricing: 0,
      other: 0,
    };
    for (const row of rows) {
      counts[categorizeAction(row.action)] += 1;
    }
    return [
      { value: "all" as const, label: "All", count: counts.all },
      { value: "billing" as const, label: "Billing", count: counts.billing },
      { value: "access" as const, label: "Access", count: counts.access },
      { value: "modules" as const, label: "Modules", count: counts.modules },
      { value: "pricing" as const, label: "Pricing", count: counts.pricing },
      { value: "other" as const, label: "Other", count: counts.other },
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return rows;
    return rows.filter((row) => categorizeAction(row.action) === categoryFilter);
  }, [rows, categoryFilter]);

  const snapshot = useMemo(() => {
    const withTenant = rows.filter((row) => Boolean(row.targetTinNumber)).length;
    const withReason = rows.filter((row) => Boolean(row.reason?.trim())).length;
    return {
      total: rows.length,
      withTenant,
      withReason,
    };
  }, [rows]);

  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "When",
        size: 140,
        minSize: 130,
        meta: {
          className: "whitespace-normal overflow-hidden",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const when = formatWhen(row.original.createdAt);
          return (
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">{when.day}</p>
              {when.time ? (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {when.time}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        size: 200,
        minSize: 180,
        maxSize: 240,
        meta: {
          className: "whitespace-normal overflow-hidden text-center",
          headerClassName: "whitespace-nowrap text-center",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <ActionPill action={row.original.action} />
          </div>
        ),
      },
      {
        id: "target",
        header: "Target",
        size: 200,
        minSize: 180,
        maxSize: 240,
        meta: {
          className: "whitespace-normal overflow-hidden",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const tin = row.original.targetTinNumber?.trim();
          const userId = row.original.targetUserId;
          if (tin) {
            return (
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 space-y-1 overflow-hidden">
                  <Link
                    href={`/tenants/${encodeURIComponent(tin)}`}
                    className="block truncate font-mono text-xs font-semibold text-foreground transition-colors hover:text-[oklch(0.82_0.04_85)]"
                    title={tin}
                  >
                    {tin}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">Wholesaler TIN</p>
                </div>
              </div>
            );
          }
          if (userId) {
            return (
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4">
                  <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    User #{userId}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Staff account</p>
                </div>
              </div>
            );
          }
          return <span className="text-sm text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: "apexMemberName",
        header: "By",
        size: 160,
        minSize: 140,
        maxSize: 190,
        meta: {
          className: "whitespace-normal overflow-hidden",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const name = row.original.apexMemberName?.trim() || null;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {memberInitials(name)}
              </span>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {name || "Apex"}
                </p>
                <p className="text-[11px] text-muted-foreground">Team member</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        size: 260,
        minSize: 220,
        meta: {
          className: "whitespace-normal overflow-hidden pl-4",
          headerClassName: "whitespace-nowrap pl-4",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const reason = row.original.reason?.trim();
          if (!reason) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <p
              className="line-clamp-2 max-w-72 text-sm leading-relaxed wrap-break-word text-muted-foreground"
              title={reason}
            >
              {reason}
            </p>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <Tabs
        value={categoryFilter}
        onValueChange={(value) => setCategoryFilter(value as AuditCategory)}
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
            <Shield className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Audit snapshot
              </p>
              <Badge variant="secondary">
                {categoryFilter === "all"
                  ? "All actions"
                  : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Review Apex team actions across billing, access control, modules, and
              pricing with searchable history.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/7 bg-background/55 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Total entries
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.total}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Loaded from recent Apex activity
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/14 bg-cyan-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-100/80">
              Wholesaler linked
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.withTenant}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Actions tied to a tenant TIN
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
              With reason
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.withReason}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Notes captured with the action
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No audit entries</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {categoryFilter === "all"
              ? "Actions taken by the Apex team will appear here."
              : "No entries match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-background/40">
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="entries"
            pageSize={10}
            showToolbar
            searchPlaceholder="Search action, TIN, member, reason…"
            rowClassName="hover:bg-white/3"
          />
        </div>
      )}
    </div>
  );
}
