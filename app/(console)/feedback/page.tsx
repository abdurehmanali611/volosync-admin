"use client";

import * as React from "react";
import { CheckCheck, Mail, MessageCircle, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  dateTimeLabel,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";
import { FeedbackStatusBadge } from "@/components/apex/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapApiError } from "@/lib/admin/core";
import { fetchFeedback, updateFeedbackStatus } from "@/lib/admin/platform";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
  const queue = useQueue(fetchFeedback);
  const [filter, setFilter] = React.useState("OPEN");

  const rows = React.useMemo(
    () =>
      filter === "ALL"
        ? queue.rows
        : queue.rows.filter((r) => r.status === filter),
    [queue.rows, filter],
  );

  const setStatus = async (id: number, status: string) => {
    try {
      await updateFeedbackStatus(id, status);
      toast.success(`Marked ${status.toLowerCase()}`);
      queue.reload();
    } catch (e) {
      toast.error(mapApiError(e, "Could not update this item."));
    }
  };

  const open = queue.rows.filter((r) => r.status === "OPEN");

  return (
    <ApexQueuePage
      title="Feedback"
      description="Questions and issues raised by wholesalers, newest first."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Feedback" },
      ]}
      loading={queue.loading}
      error={queue.error}
      columns={4}
    >
      <div className="space-y-4">
        <ApexQueueStats
          items={[
            { label: "Open", value: open.length, tone: "sky" },
            {
              label: "Read",
              value: queue.rows.filter((r) => r.status === "READ").length,
              tone: "amber",
            },
            {
              label: "Resolved",
              value: queue.rows.filter((r) => r.status === "RESOLVED").length,
              tone: "emerald",
            },
            { label: "Total", value: queue.rows.length },
          ]}
        />
        <ApexPillTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "OPEN", label: "Open", count: open.length },
            {
              value: "READ",
              label: "Read",
              count: queue.rows.filter((r) => r.status === "READ").length,
            },
            {
              value: "RESOLVED",
              label: "Resolved",
              count: queue.rows.filter((r) => r.status === "RESOLVED").length,
            },
            { value: "ALL", label: "All", count: queue.rows.length },
          ]}
        />

        {rows.length === 0 ? (
          <ApexPanel>
            <ApexEmptyState
              icon={MessageCircle}
              title="Inbox is clear"
              description="No feedback matches this filter."
            />
          </ApexPanel>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article
                key={row.id}
                className={cn(
                  "apex-panel-surface rounded-xl border p-4 transition-colors",
                  row.status === "OPEN"
                    ? "border-sky-500/25 bg-sky-500/4"
                    : "border-white/6 hover:border-white/12",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{row.subject}</h3>
                      <FeedbackStatusBadge status={row.status} />
                      <Badge
                        variant="outline"
                        className="border-transparent bg-white/6 font-mono text-[10px] uppercase text-muted-foreground"
                      >
                        {row.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.tenant || "Platform"}
                      {row.contact ? ` · ${row.contact}` : ""} ·{" "}
                      {dateTimeLabel(row.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {row.status === "OPEN" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 cursor-pointer"
                        onClick={() => setStatus(row.id, "READ")}
                      >
                        <MailOpen className="mr-1 size-3.5" /> Mark read
                      </Button>
                    ) : null}
                    {row.status !== "RESOLVED" ? (
                      <Button
                        size="sm"
                        className="h-8 cursor-pointer bg-apex-emerald text-white hover:brightness-110"
                        onClick={() => setStatus(row.id, "RESOLVED")}
                      >
                        <CheckCheck className="mr-1 size-3.5" /> Resolve
                      </Button>
                    ) : null}
                  </div>
                </div>
                {row.body ? (
                  <p className="mt-3 whitespace-pre-line border-t border-white/6 pt-3 text-sm leading-relaxed text-muted-foreground">
                    {row.body}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
        {rows.some((r) => r.contact) ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="size-3.5" /> Reply using the contact details on
            each message.
          </p>
        ) : null}
      </div>
    </ApexQueuePage>
  );
}
