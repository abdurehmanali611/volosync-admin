"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Puzzle,
  X,
} from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approveModuleChangeRequest,
  rejectModuleChangeRequest,
  type ModuleChangeRequestRow,
} from "@/lib/apex/actions";
import {
  parseModuleChangeRequestNote,
  type ModuleChangeKind,
  type ParsedModuleChangeRequest,
} from "@/lib/apex/moduleChangeRequest";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

type Props = {
  rows: ModuleChangeRequestRow[];
  onChanged: () => void;
};

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

function formatSubmittedAt(value: string) {
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

function moduleCountLabel(count: number) {
  return `${count} ${count === 1 ? "module" : "modules"}`;
}

function getParsed(row: ModuleChangeRequestRow): ParsedModuleChangeRequest {
  return parseModuleChangeRequestNote(row.requestNote, row.requestedModules);
}

function changedModulesFor(row: ModuleChangeRequestRow, parsed: ParsedModuleChangeRequest) {
  return parsed.changedModules.length > 0
    ? parsed.changedModules
    : parsed.projectedModules;
}

function RequestStatusPill({ status }: { status: string }) {
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

function ChangeTypePill({ changeType }: { changeType: ModuleChangeKind }) {
  if (changeType === "add") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
        <Plus className="h-3 w-3" />
        Add
      </span>
    );
  }
  if (changeType === "remove") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200">
        <Minus className="h-3 w-3" />
        Remove
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      Change
    </span>
  );
}

function ModuleChips({
  modules,
  tone = "neutral",
}: {
  modules: string[];
  tone?: "neutral" | "add" | "remove";
}) {
  if (modules.length === 0) {
    return <span className="text-xs text-muted-foreground">No modules listed</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {modules.map((moduleName) => (
        <Badge
          key={moduleName}
          variant="secondary"
          className={cn(
            "max-w-full rounded-md px-2 py-0.5 text-[11px] font-medium wrap-break-word whitespace-normal",
            tone === "add" && "border-emerald-500/15 bg-emerald-500/8 text-emerald-100",
            tone === "remove" && "border-rose-500/15 bg-rose-500/8 text-rose-100",
          )}
          title={moduleName}
        >
          {moduleName}
        </Badge>
      ))}
    </div>
  );
}

function ModuleRequestPreview({
  row,
  parsed,
  onOpenDetail,
}: {
  row: ModuleChangeRequestRow;
  parsed: ParsedModuleChangeRequest;
  onOpenDetail: () => void;
}) {
  const changed = changedModulesFor(row, parsed);
  const tone =
    parsed.changeType === "add"
      ? "add"
      : parsed.changeType === "remove"
        ? "remove"
        : "neutral";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <ChangeTypePill changeType={parsed.changeType} />
          <RequestStatusPill status={row.status} />
        </div>
        <p className="text-sm font-semibold wrap-break-word">{row.hotelDisplayName}</p>
        <p className="text-[11px] text-muted-foreground">
          {moduleCountLabel(changed.length)}{" "}
          {parsed.changeType === "remove" ? "to remove" : "to add"}
          {parsed.projectedModules.length > 0
            ? ` · ${moduleCountLabel(parsed.projectedModules.length)} after approval`
            : ""}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {parsed.changeType === "remove" ? "Modules to remove" : "Modules to add"}
        </p>
        <ModuleChips modules={changed} tone={tone} />
      </div>

      {parsed.projectedModules.length > 0 && parsed.changeType !== "unknown" ? (
        <div className="space-y-1.5 border-t border-border/50 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            After approval
          </p>
          <ModuleChips modules={parsed.projectedModules} />
        </div>
      ) : null}

      {parsed.freeNote ? (
        <p className="text-xs leading-relaxed text-muted-foreground wrap-break-word">
          {parsed.freeNote}
        </p>
      ) : null}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onOpenDetail}>
        Open detail
      </Button>
    </div>
  );
}

function ModuleRequestSheetBody({
  row,
  parsed,
}: {
  row: ModuleChangeRequestRow;
  parsed: ParsedModuleChangeRequest;
}) {
  const changed = changedModulesFor(row, parsed);
  const tone =
    parsed.changeType === "add"
      ? "add"
      : parsed.changeType === "remove"
        ? "remove"
        : "neutral";

  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ChangeTypePill changeType={parsed.changeType} />
          <RequestStatusPill status={row.status} />
        </div>

        <dl className="grid w-full min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[11px] text-muted-foreground">Wholesaler</dt>
            <dd className="font-medium wrap-break-word">{row.hotelDisplayName}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">TIN</dt>
            <dd className="font-mono text-xs font-medium break-all">{row.tinNumber}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Requested by</dt>
            <dd className="font-medium capitalize">{row.requestedBySide}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Submitted</dt>
            <dd className="font-medium">
              {(() => {
                const submitted = formatSubmittedAt(row.createdAt);
                return submitted.time
                  ? `${submitted.day} · ${submitted.time}`
                  : submitted.day;
              })()}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Change size</dt>
            <dd className="font-medium tabular-nums">{moduleCountLabel(changed.length)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {parsed.changeType === "remove" ? "Modules to remove" : "Modules to add"}
        </p>
        <ModuleChips modules={changed} tone={tone} />
      </div>

      {parsed.currentModules.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Current modules</p>
          <ModuleChips modules={parsed.currentModules} />
        </div>
      ) : null}

      {parsed.projectedModules.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">After approval</p>
          <ModuleChips modules={parsed.projectedModules} />
        </div>
      ) : null}

      {parsed.freeNote ? (
        <div className="space-y-2 rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-sm font-semibold">Tenant message</p>
          <p className="text-sm leading-relaxed text-muted-foreground wrap-break-word">
            {parsed.freeNote}
          </p>
        </div>
      ) : null}

      <Button asChild variant="outline" size="sm" className="w-full">
        <Link href={`/tenants/${encodeURIComponent(row.tinNumber)}`}>
          Open wholesaler page
        </Link>
      </Button>
    </div>
  );
}

function ModuleRequestDetailTrigger({
  row,
  children,
  className,
}: {
  row: ModuleChangeRequestRow;
  children: ReactNode;
  className?: string;
}) {
  const parsed = getParsed(row);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const schedulePreviewOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 220);
  };

  const schedulePreviewClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 160);
  };

  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  return (
    <>
      <Popover
        open={previewOpen && !sheetOpen}
        onOpenChange={(next) => {
          if (!next) setPreviewOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/detail max-w-full rounded-md text-left outline-none transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40",
              "cursor-pointer",
              className,
            )}
            onMouseEnter={schedulePreviewOpen}
            onMouseLeave={schedulePreviewClose}
            onFocus={schedulePreviewOpen}
            onBlur={schedulePreviewClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSheet();
              }
            }}
            aria-label={`Module details for ${row.hotelDisplayName}`}
          >
            <span className="inline-flex max-w-full items-start gap-1">
              <span className="min-w-0 flex-1">{children}</span>
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/detail:opacity-70" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="flex max-h-[min(80vh,36rem)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <ModuleRequestPreview
              row={row}
              parsed={parsed}
              onOpenDetail={openSheet}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100%,32rem)] data-[side=right]:max-w-[min(100%,32rem)] data-[side=right]:sm:w-lg data-[side=right]:sm:max-w-lg"
        >
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-5 py-4 pr-14 text-left">
            <SheetTitle className="text-base leading-snug wrap-break-word">
              Module request detail
            </SheetTitle>
            <SheetDescription className="text-xs leading-snug wrap-break-word">
              {row.hotelDisplayName} ·{" "}
              {parsed.changeType === "remove" ? "Remove" : parsed.changeType === "add" ? "Add" : "Change"}{" "}
              {moduleCountLabel(changedModulesFor(row, parsed).length)}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4">
            <ModuleRequestSheetBody row={row} parsed={parsed} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function RequestReviewActions({
  requestId,
  status,
  onDone,
}: {
  requestId: number;
  status: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  if (status !== "pending") {
    return (
      <div className="flex justify-end">
        <RequestStatusPill status={status} />
      </div>
    );
  }

  const run = async (fn: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="success"
        className="apex-row-action gap-1.5"
        disabled={busy}
        onClick={() =>
          void run(
            () => approveModuleChangeRequest(requestId),
            "Module request approved",
          )
        }
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="apex-row-action gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={busy}
        onClick={() =>
          void run(
            () => rejectModuleChangeRequest(requestId),
            "Module request rejected",
          )
        }
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}

export function ApexModuleRequestsTable({ rows, onChanged }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
    const addCount = rows.filter(
      (row) => getParsed(row).changeType === "add",
    ).length;
    const removeCount = rows.filter(
      (row) => getParsed(row).changeType === "remove",
    ).length;
    return { pending, addCount, removeCount };
  }, [rows]);

  const columns = useMemo<ColumnDef<ModuleChangeRequestRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Wholesaler",
        size: 240,
        minSize: 210,
        maxSize: 280,
        meta: {
          className: "whitespace-normal",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const parsed = getParsed(row.original);
          return (
            <div className="w-full min-w-0 max-w-full space-y-1.5 overflow-hidden">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
                  <Link
                    href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
                    className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-[oklch(0.82_0.04_85)]"
                    title={row.original.hotelDisplayName}
                  >
                    {row.original.hotelDisplayName}
                  </Link>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    TIN {row.original.tinNumber}
                  </p>
                  <Badge
                    variant="outline"
                    className="rounded-md px-1.5 py-0 text-[10px] capitalize"
                  >
                    {row.original.requestedBySide}
                  </Badge>
                </div>
              </div>
              {parsed.freeNote ? (
                <p
                  className="line-clamp-2 text-xs leading-relaxed wrap-break-word text-muted-foreground"
                  title={parsed.freeNote}
                >
                  {parsed.freeNote}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "changeType",
        header: "Change",
        size: 110,
        minSize: 100,
        maxSize: 120,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const parsed = getParsed(row.original);
          return <ChangeTypePill changeType={parsed.changeType} />;
        },
      },
      {
        id: "requestedModules",
        header: "Modules",
        size: 220,
        minSize: 190,
        maxSize: 260,
        meta: {
          className: "whitespace-normal",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const parsed = getParsed(row.original);
          const changed = changedModulesFor(row.original, parsed);
          return (
            <ModuleRequestDetailTrigger row={row.original} className="w-full px-1 py-1">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-semibold text-foreground">
                  {changed.length > 0 ? changed[0] : "No modules"}
                  {changed.length > 1 ? ` +${changed.length - 1}` : ""}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {moduleCountLabel(changed.length)}{" "}
                  {parsed.changeType === "remove" ? "to remove" : "to add"}
                  {parsed.projectedModules.length > 0
                    ? ` · ${parsed.projectedModules.length} after`
                    : ""}
                </p>
              </div>
            </ModuleRequestDetailTrigger>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        minSize: 110,
        maxSize: 130,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => <RequestStatusPill status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        size: 140,
        minSize: 140,
        meta: {
          className: "whitespace-normal overflow-hidden pr-8",
          headerClassName: "whitespace-nowrap pr-8",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const submitted = formatSubmittedAt(row.original.createdAt);
          return (
            <div className="min-w-0 space-y-0.5 pr-2">
              <p className="text-sm font-medium text-foreground">{submitted.day}</p>
              {submitted.time ? (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {submitted.time}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "review",
        header: () => <div className="w-full text-right">Review</div>,
        size: 250,
        minSize: 250,
        enableHiding: false,
        meta: {
          className: "whitespace-nowrap pl-10",
          headerClassName: "whitespace-nowrap pl-10 text-right",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <div className="pl-2">
            <RequestReviewActions
              requestId={row.original.id}
              status={row.original.status}
              onDone={onChanged}
            />
          </div>
        ),
      },
    ],
    [onChanged],
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
            <Puzzle className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Request snapshot
              </p>
              <Badge variant="secondary">
                {statusFilter === "all"
                  ? "All requests"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Hover modules for a quick preview, open the detail sheet for the full stack,
              then approve or reject pending requests.
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
              Add requests
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.addCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expand tenant module footprint
            </p>
          </div>
          <div className="rounded-xl border border-rose-500/14 bg-rose-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-200/80">
              Remove requests
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.removeCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reduce unused active modules
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
            <Puzzle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No module requests</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {statusFilter === "pending"
              ? "No pending module change requests right now."
              : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-background/40">
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="requests"
            pageSize={10}
            showToolbar
            searchPlaceholder="Search wholesaler, TIN, modules…"
            rowClassName="hover:bg-white/3"
          />
        </div>
      )}
    </div>
  );
}
