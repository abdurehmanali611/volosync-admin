"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, Building2, MessageCircle, MessagesSquare } from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexStartChatDialog } from "@/components/apex/feedback/ApexStartChatDialog";
import { ApexFeedbackConversationTrigger } from "@/components/apex/feedback/ApexFeedbackConversationTrigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedbackDirectoryRow } from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

type ChatFilter = "all" | "needs_reply" | "open" | "closed" | "no_chat";

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

type Props = {
  rows: FeedbackDirectoryRow[];
  onStarted?: () => void;
};

function ChatStatusPill({
  threadId,
  status,
}: {
  threadId: number | null;
  status: string;
}) {
  if (!threadId) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
        No chat
      </span>
    );
  }
  const closed = String(status).toLowerCase() === "closed";
  if (closed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
      Open
    </span>
  );
}

function formatRelativeTime(value: string | null) {
  if (!value) return "—";
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms)) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function PropertyAvatar({
  logoUrl,
  emphasize,
}: {
  logoUrl?: string | null;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border",
        emphasize
          ? "border-[oklch(0.68_0.05_85/0.28)] bg-[oklch(0.68_0.05_85/0.12)]"
          : "border-white/10 bg-white/5",
      )}
      aria-hidden
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Building2
          className={cn(
            "h-4 w-4",
            emphasize
              ? "text-[oklch(0.88_0.05_85)]"
              : "text-muted-foreground",
          )}
        />
      )}
    </div>
  );
}

export function ApexFeedbackDirectoryTable({ rows, onStarted }: Props) {
  const [filter, setFilter] = useState<ChatFilter>("all");

  const snapshot = useMemo(() => {
    const needsReply = rows.filter((r) => r.unreadFromTenant > 0).length;
    const open = rows.filter(
      (r) => r.threadId && String(r.chatStatus).toLowerCase() === "open",
    ).length;
    const noChat = rows.filter((r) => !r.threadId).length;
    return { needsReply, open, noChat };
  }, [rows]);

  const tabItems = useMemo(
    () => [
      { value: "all" as const, label: "All", count: rows.length },
      {
        value: "needs_reply" as const,
        label: "Needs reply",
        count: snapshot.needsReply,
      },
      {
        value: "open" as const,
        label: "Open",
        count: snapshot.open,
      },
      {
        value: "closed" as const,
        label: "Closed",
        count: rows.filter(
          (r) => r.threadId && String(r.chatStatus).toLowerCase() === "closed",
        ).length,
      },
      {
        value: "no_chat" as const,
        label: "No chat",
        count: snapshot.noChat,
      },
    ],
    [rows, snapshot.needsReply, snapshot.noChat, snapshot.open],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "needs_reply":
        return rows.filter((r) => r.unreadFromTenant > 0);
      case "open":
        return rows.filter(
          (r) => r.threadId && String(r.chatStatus).toLowerCase() === "open",
        );
      case "closed":
        return rows.filter(
          (r) => r.threadId && String(r.chatStatus).toLowerCase() === "closed",
        );
      case "no_chat":
        return rows.filter((r) => !r.threadId);
      default:
        return rows;
    }
  }, [filter, rows]);

  const columns = useMemo<ColumnDef<FeedbackDirectoryRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Wholesaler",
        minSize: 220,
        cell: ({ row }) => {
          const name = row.original.hotelDisplayName;
          const unread = row.original.unreadFromTenant;
          return (
            <div className="flex items-start gap-3">
              <PropertyAvatar
                logoUrl={row.original.logoUrl}
                emphasize={unread > 0}
              />
              <div className="min-w-0 space-y-0.5">
                <Link
                  href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
                  className="block truncate font-medium tracking-tight transition-colors hover:text-[oklch(0.86_0.05_85)]"
                >
                  {name}
                </Link>
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                  {row.original.tinNumber}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "chatStatus",
        header: "Status",
        size: 120,
        minSize: 110,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <ChatStatusPill
            threadId={row.original.threadId}
            status={row.original.chatStatus}
          />
        ),
      },
      {
        id: "conversation",
        header: "Conversation",
        size: 260,
        minSize: 200,
        maxSize: 320,
        meta: {
          className: "max-w-[20rem]",
          headerClassName: "max-w-[20rem]",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const msg = row.original.lastMessage;
          if (!msg?.body) {
            return (
              <span className="text-sm text-muted-foreground/80">
                No messages yet
              </span>
            );
          }
          return (
            <ApexFeedbackConversationTrigger
              hotelDisplayName={row.original.hotelDisplayName}
              tinNumber={row.original.tinNumber}
              threadId={row.original.threadId}
              unreadFromTenant={row.original.unreadFromTenant}
              senderSide={msg.senderSide}
              body={msg.body}
              createdAt={msg.createdAt}
            />
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Activity",
        size: 110,
        minSize: 100,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const absolute = row.original.updatedAt
            ? new Date(row.original.updatedAt).toLocaleString()
            : undefined;
          return (
            <span
              className="text-sm tabular-nums text-muted-foreground"
              title={absolute}
            >
              {formatRelativeTime(row.original.updatedAt)}
            </span>
          );
        },
      },
      {
        id: "open",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        enableHiding: false,
        size: 130,
        minSize: 120,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          if (row.original.threadId) {
            return (
              <div className="flex justify-end">
                <Button
                  asChild
                  size="sm"
                  variant={
                    row.original.unreadFromTenant > 0 ? "apex" : "outline"
                  }
                  className="apex-row-action h-9 gap-1.5 rounded-xl px-3"
                >
                  <Link href={`/feedback/${row.original.threadId}`}>
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
                  </Link>
                </Button>
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <ApexStartChatDialog
                defaultTin={row.original.tinNumber}
                onDone={onStarted}
                trigger={
                  <Button
                    size="sm"
                    variant="apex"
                    className="apex-row-action h-9 gap-1.5 rounded-xl px-3"
                  >
                    Start
                    <MessageCircle className="h-3.5 w-3.5 opacity-90" />
                  </Button>
                }
              />
            </div>
          );
        },
      },
    ],
    [onStarted],
  );

  return (
    <div className="space-y-5 pt-4">
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as ChatFilter)}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2.5 rounded-none border-0 bg-transparent p-0 px-4 shadow-none sm:px-5">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="apex-tabs-trigger h-11 flex-none gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-left leading-none shadow-sm transition-all duration-150 hover:border-white/12 hover:bg-white/4.5 data-[state=active]:border-[oklch(0.68_0.05_85/0.28)] data-[state=active]:bg-[oklch(0.24_0.014_265)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_8px_20px_-12px_oklch(0.88_0.06_85/0.45)]"
            >
              <span className="text-sm font-medium tracking-tight">
                {tab.label}
              </span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground dark:bg-white/10">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mx-4 flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:mx-5 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
            <MessagesSquare className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Chat snapshot
              </p>
              <Badge variant="outline">
                {filter === "all"
                  ? "All wholesalers"
                  : tabItems.find((t) => t.value === filter)?.label}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Active wholesalers only — jump into open threads or start a new
              conversation when something needs attention.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
              Needs reply
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.needsReply}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unread messages from tenants
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/14 bg-emerald-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/80">
              Open threads
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.open}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Conversations currently active
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              No chat yet
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.noChat}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready to start when needed
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-4 mb-4 rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-14 text-center sm:mx-5">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            No wholesalers in this view
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another filter, or start a chat from the header.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border-t border-white/8">
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="wholesalers"
            pageSize={10}
            rowClassName={(row) =>
              row.unreadFromTenant > 0
                ? "bg-[oklch(0.68_0.05_85/0.035)] hover:bg-[oklch(0.68_0.05_85/0.06)]"
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
