"use client";

import * as React from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { FileText, Search } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  dateTimeLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchAudit, type AuditRow } from "@/lib/admin/platform";

const GROUPS = [
  "ALL",
  "TENANT",
  "PAYMENT",
  "MODULE",
  "PRICING",
  "FEEDBACK",
  "USER",
];

const groupOf = (action: string) => {
  if (action.startsWith("TENANT_") || action.startsWith("OWNER_"))
    return "TENANT";
  if (action.startsWith("SETUP_") || action.includes("SUBSCRIPTION"))
    return "PAYMENT";
  if (action.startsWith("MODULE_")) return "MODULE";
  if (action.startsWith("PRICING_")) return "PRICING";
  if (action.startsWith("FEEDBACK_")) return "FEEDBACK";
  if (action.startsWith("PASSWORD_")) return "USER";
  return "ALL";
};

export default function AuditPage() {
  const queue = useQueue(fetchAudit);
  const [group, setGroup] = React.useState("ALL");
  const [query, setQuery] = React.useState("");

  const rows = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return queue.rows.filter((row) => {
      if (group !== "ALL" && groupOf(row.action) !== group) return false;
      if (!term) return true;
      return (
        row.actor.toLowerCase().includes(term) ||
        row.action.toLowerCase().includes(term) ||
        row.detail.toLowerCase().includes(term) ||
        row.target_type.toLowerCase().includes(term)
      );
    });
  }, [queue.rows, group, query]);

  const columns = React.useMemo<LegacyColumnDef<AuditRow, unknown>[]>(
    () => [
      {
        accessorKey: "at",
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {dateTimeLabel(row.original.at)}
          </span>
        ),
      },
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.actor}</span>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="border-transparent bg-apex-sky/12 font-mono text-[10px] uppercase text-apex-sky"
          >
            {row.original.action}
          </Badge>
        ),
      },
      {
        id: "target",
        header: "Target",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.target_type}
            {row.original.target_id ? ` #${row.original.target_id}` : ""}
          </span>
        ),
      },
      {
        accessorKey: "detail",
        header: "Detail",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[320px] font-mono text-xs text-muted-foreground">
            {row.original.detail || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ApexQueuePage
      title="Audit log"
      description="The last 200 platform actions — every mutation is recorded with its actor."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Audit log" },
      ]}
      loading={queue.loading}
      error={queue.error}
      columns={5}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ApexPillTabs
            value={group}
            onChange={setGroup}
            tabs={GROUPS.map((value) => ({
              value,
              label:
                value === "ALL"
                  ? "All"
                  : value.charAt(0) + value.slice(1).toLowerCase(),
              count:
                value === "ALL"
                  ? queue.rows.length
                  : queue.rows.filter((r) => groupOf(r.action) === value)
                      .length,
            }))}
          />
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search action, actor or detail"
              className="h-9 pl-9"
            />
          </div>
        </div>
        <ApexPanel>
          {rows.length === 0 ? (
            <ApexEmptyState
              icon={FileText}
              title="No audit entries match"
              description="Try a different category or search term."
            />
          ) : (
            <ApexDataTable
              data={rows}
              columns={columns}
              noun="entries"
              pageSize={15}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>
    </ApexQueuePage>
  );
}
