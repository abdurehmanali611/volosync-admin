"use client";

import * as React from "react";
import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Phone, UserPlus } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { ApexCreateTenantDialog } from "@/components/apex/platform/ApexCreateTenantDialog";
import {
  DecisionStatusBadge,
  SubscriptionStatusBadge,
} from "@/components/apex/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/admin/api";
import { fetchSignups, type SignupRow } from "@/lib/admin/platform";

const WHATSAPP = ["+251935000642", "+251930272975"];

export default function SignupsPage() {
  const queue = useQueue(fetchSignups);
  const [filter, setFilter] = React.useState("ALL");

  const rows = React.useMemo(
    () =>
      filter === "ALL"
        ? queue.rows
        : queue.rows.filter((r) => r.setup_status === filter),
    [queue.rows, filter],
  );

  const columns = React.useMemo<LegacyColumnDef<SignupRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Business",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/tenants/${row.original.id}`}
              className="truncate font-medium hover:text-apex-emerald hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="font-mono text-[11px] text-muted-foreground">
              {row.original.tin}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "sales_agent",
        header: "Agent",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.sales_agent || "Direct"}
          </span>
        ),
      },
      {
        id: "modules",
        header: "Modules",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="border-transparent bg-apex-emerald/12 text-[10px] uppercase text-apex-emerald"
            >
              Cred
            </Badge>
            {row.original.module_inventory ? (
              <Badge
                variant="outline"
                className="border-transparent bg-apex-teal/12 text-[10px] uppercase text-apex-teal"
              >
                Inv
              </Badge>
            ) : null}
            {row.original.module_hr ? (
              <Badge
                variant="outline"
                className="border-transparent bg-apex-violet/12 text-[10px] uppercase text-[oklch(0.85_0.1_295)]"
              >
                HR
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Signed up",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateLabel(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "setup_status",
        header: "Setup payment",
        cell: ({ row }) => (
          <div className="space-y-1">
            <DecisionStatusBadge status={row.original.setup_status} />
            {row.original.setup_amount ? (
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {money(row.original.setup_amount)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "subscription_state",
        header: "Subscription",
        cell: ({ row }) => (
          <SubscriptionStatusBadge status={row.original.subscription_state} />
        ),
      },
    ],
    [],
  );

  return (
    <ApexQueuePage
      title="New signups"
      description="Wholesalers that joined this month — filter by pending, approved or rejected setup."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "New signups" },
      ]}
      actions={
        <ApexCreateTenantDialog>Create tenant manually</ApexCreateTenantDialog>
      }
      loading={queue.loading}
      error={queue.error}
      columns={6}
    >
      <div className="space-y-4">
        <ApexInfoBanner icon={Phone}>
          Escalation WhatsApp: {WHATSAPP.join(" · ")}
        </ApexInfoBanner>
        <ApexQueueStats
          items={[
            { label: "This month", value: queue.rows.length, tone: "emerald" },
            {
              label: "Setup pending",
              value: queue.rows.filter((r) => r.setup_status === "PENDING")
                .length,
              tone: "amber",
            },
            {
              label: "Setup approved",
              value: queue.rows.filter((r) => r.setup_status === "APPROVED")
                .length,
              tone: "emerald",
            },
            {
              label: "Via agents",
              value: queue.rows.filter((r) => r.sales_agent).length,
              tone: "sky",
            },
          ]}
        />
        <ApexPillTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "ALL", label: "All", count: queue.rows.length },
            {
              value: "PENDING",
              label: "Pending",
              count: queue.rows.filter((r) => r.setup_status === "PENDING")
                .length,
            },
            {
              value: "APPROVED",
              label: "Approved",
              count: queue.rows.filter((r) => r.setup_status === "APPROVED")
                .length,
            },
            {
              value: "REJECTED",
              label: "Rejected",
              count: queue.rows.filter((r) => r.setup_status === "REJECTED")
                .length,
            },
          ]}
        />
        <ApexPanel>
          {rows.length === 0 ? (
            <ApexEmptyState
              icon={UserPlus}
              title="No signups this month"
              description="New wholesalers appear here as soon as they are onboarded."
              action={
                <ApexCreateTenantDialog>
                  Create tenant manually
                </ApexCreateTenantDialog>
              }
            />
          ) : (
            <ApexDataTable
              data={rows}
              columns={columns}
              noun="signups"
              pageSize={12}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>
    </ApexQueuePage>
  );
}
