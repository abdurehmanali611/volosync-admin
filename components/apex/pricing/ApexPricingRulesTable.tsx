"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatETB } from "@/lib/apex/analytics";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
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
import { APEX_BUSINESS_TYPES } from "@/constants/businessTypes";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";
import {
  deletePricingRule,
  planNameFromModules,
  upsertPricingRule,
  type PricingRuleRow,
} from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

type Props = {
  rules: PricingRuleRow[];
  onChanged: () => void;
};

type EditorState = {
  id?: number;
  businessType: string;
  modules: Set<string>;
  setupFeeETB: string;
  yearlyFeeETB: string;
  description: string;
};

const BUSINESS_TYPE_KEYS = APEX_BUSINESS_TYPES.map((b) => b.key);

function planLabel(row: PricingRuleRow) {
  return row.modulesKey || row.description || "Standard plan";
}

function emptyEditor(bt: string): EditorState {
  return {
    businessType: bt,
    modules: new Set(),
    setupFeeETB: "0",
    yearlyFeeETB: "0",
    description: "",
  };
}

function moduleCountLabel(count: number) {
  return `${count} ${count === 1 ? "module" : "modules"}`;
}

function PricingRuleStatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70" />
      Inactive
    </span>
  );
}

function PricingRulePreview({
  row,
  onOpenDetail,
}: {
  row: PricingRuleRow;
  onOpenDetail: () => void;
}) {
  const modules = (row.modules as string[]) ?? [];
  const planName = row.modulesKey || row.description || "Standard plan";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.32)] via-[oklch(0.22_0.03_265/0.3)] to-[oklch(0.32_0.05_85/0.18)] p-3">
        <div className="pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full bg-[oklch(0.62_0.1_195/0.2)] blur-2xl" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold tracking-tight">{planName}</p>
            <p className="text-[11px] text-muted-foreground">
              {modules.length > 0 ? moduleCountLabel(modules.length) : "Base package"}
            </p>
          </div>
          <PricingRuleStatusPill isActive={row.isActive} />
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/8 bg-white/6">
          <div className="min-w-0 space-y-0.5 bg-black/25 px-2.5 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Setup
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatETB(row.setupFeeETB)}
            </p>
          </div>
          <div className="min-w-0 space-y-0.5 bg-black/25 px-2.5 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Yearly
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatETB(row.yearlyFeeETB)}
            </p>
          </div>
        </div>
      </div>

      {row.description ? (
        <p className="rounded-lg border border-white/7 bg-white/3 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {row.description}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Included modules
        </p>
        <div className="flex flex-wrap gap-1.5">
          {modules.length > 0 ? (
            modules.map((moduleName) => (
              <span
                key={moduleName}
                className="rounded-md border border-[var(--apex-teal)]/30 bg-[var(--apex-teal)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--apex-teal)]"
              >
                {moduleName}
              </span>
            ))
          ) : (
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px]">
              Base package
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant="apex"
        className="h-10 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold"
        onClick={onOpenDetail}
      >
        Open detail
        <ArrowRight className="h-4 w-4 opacity-80" />
      </Button>
    </div>
  );
}

function PricingRuleSheetBody({
  row,
  onEdit,
}: {
  row: PricingRuleRow;
  onEdit: () => void;
}) {
  const modules = (row.modules as string[]) ?? [];

  return (
    <div className="space-y-5 pb-2">
      <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.32)] via-[oklch(0.22_0.03_265/0.34)] to-[oklch(0.32_0.05_85/0.2)] p-4">
        <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[oklch(0.62_0.1_195/0.18)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-[oklch(0.72_0.08_85/0.14)] blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-base font-semibold tracking-tight">
              {row.modulesKey || row.description || "Standard plan"}
            </p>
            <p className="text-xs text-muted-foreground">
              {modules.length > 0 ? moduleCountLabel(modules.length) : "Base package"}
            </p>
          </div>
          <PricingRuleStatusPill isActive={row.isActive} />
        </div>

        <dl className="relative grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/6 text-sm sm:grid-cols-2">
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Setup fee
            </dt>
            <dd className="font-semibold tabular-nums">{formatETB(row.setupFeeETB)}</dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Yearly fee
            </dt>
            <dd className="font-semibold tabular-nums">{formatETB(row.yearlyFeeETB)}</dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Availability
            </dt>
            <dd className="text-xs leading-relaxed text-muted-foreground">
              {row.isActive
                ? "Currently available for matching tenant pricing."
                : "Hidden from active pricing selection."}
            </dd>
          </div>
          {row.description ? (
            <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5 sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </dt>
              <dd className="text-sm leading-relaxed">{row.description}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="space-y-2.5 rounded-xl border border-border/50 bg-card/45 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="h-4 w-4 shrink-0 text-[var(--apex-teal)]" />
            Included modules
          </p>
          <span className="shrink-0 rounded-md bg-white/6 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {modules.length || "—"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modules.length > 0 ? (
            modules.map((moduleName) => (
              <span
                key={moduleName}
                className="rounded-md border border-[var(--apex-teal)]/30 bg-[var(--apex-teal)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--apex-teal)]"
              >
                {moduleName}
              </span>
            ))
          ) : (
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px]">
              Base package
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant="apex"
        className="h-11 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold"
        onClick={onEdit}
      >
        <PencilLine className="h-4 w-4" />
        Edit pricing rule
      </Button>
    </div>
  );
}

function PricingRuleDetailTrigger({
  row,
  children,
  className,
  onEdit,
}: {
  row: PricingRuleRow;
  children: ReactNode;
  className?: string;
  onEdit: () => void;
}) {
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
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
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
              "group/detail w-full rounded-md text-left outline-none transition-colors",
              "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40",
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
            aria-label={`Details for ${planLabel(row)}`}
          >
            <span className="inline-flex w-full items-start gap-1">
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
          className="flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="h-1 w-full shrink-0 bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <div className="min-h-0 flex-1 overflow-y-auto bg-card/35 p-3">
            <PricingRulePreview
              row={row}
              onOpenDetail={openSheet}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100%,36rem)] data-[side=right]:max-w-[min(100%,36rem)] data-[side=right]:sm:w-[36rem] data-[side=right]:sm:max-w-[36rem]">
          <div className="h-1 w-full shrink-0 bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 bg-card/40 px-5 py-4 pr-14 text-left">
            <SheetTitle className="text-base leading-snug wrap-break-word">
              {planLabel(row)}
            </SheetTitle>
            <SheetDescription className="text-xs leading-snug wrap-break-word">
              Review this pricing tier, then open the editor if you need to change
              its modules or fee values.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <PricingRuleSheetBody
              row={row}
              onEdit={() => {
                setSheetOpen(false);
                onEdit();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ApexPricingRulesTable({ rules, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => emptyEditor(BUSINESS_TYPE_KEYS[0]));
  const displayableRules = rules;

  const filtered = displayableRules;

  const activeCount = filtered.filter((row) => row.isActive).length;
  const inactiveCount = filtered.length - activeCount;

  const columns = useMemo<ColumnDef<PricingRuleRow>[]>(
    () => [
      {
        accessorKey: "modulesKey",
        header: "Plan",
        cell: ({ row }) => (
          <PricingRuleDetailTrigger
            row={row.original}
            className="px-1 py-0.5 -mx-1"
            onEdit={() => openEdit(row.original)}
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground transition-colors group-hover/detail:text-[oklch(0.82_0.04_85)] group-hover/price:text-[oklch(0.82_0.04_85)]">
                {row.original.modulesKey ||
                  row.original.description ||
                  "Standard plan"}
              </p>
              <p className="text-xs text-muted-foreground">
                {((row.original.modules as string[]) ?? []).length > 0
                  ? moduleCountLabel(((row.original.modules as string[]) ?? []).length)
                  : "Base package"}
              </p>
            </div>
          </PricingRuleDetailTrigger>
        ),
      },
      {
        accessorKey: "setupFeeETB",
        header: () => <div className="text-right">Setup</div>,
        meta: { label: "Setup" },
        cell: ({ row }) => (
          <div className="text-right">
            <p className="tabular-nums text-sm font-semibold">
              {formatETB(row.original.setupFeeETB)}
            </p>
            <p className="text-[11px] text-muted-foreground">One-time onboarding fee</p>
          </div>
        ),
      },
      {
        accessorKey: "yearlyFeeETB",
        header: () => <div className="text-right">Yearly</div>,
        meta: { label: "Yearly" },
        cell: ({ row }) => (
          <div className="text-right">
            <p className="tabular-nums text-sm font-semibold">
              {formatETB(row.original.yearlyFeeETB)}
            </p>
            <p className="text-[11px] text-muted-foreground">Recurring every 3 months</p>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          <PricingRuleStatusPill isActive={row.original.isActive} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer rounded-lg px-3 text-muted-foreground transition-colors group-hover/price:text-foreground"
              disabled={busy}
              onClick={() => openEdit(row.original)}
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer rounded-lg border-destructive/25 px-3 text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete pricing rule</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deletes the{" "}
                    <span className="font-medium text-foreground">
                      {planLabel(row.original)}
                    </span>{" "}
                    tier
                    {((row.original.modules as string[]) ?? []).length > 0
                      ? ` for ${((row.original.modules as string[]) ?? []).join(", ")}`
                      : ""}
                    . This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-xl font-semibold"
                    onClick={() => void removeRule(row.original)}
                  >
                    Delete rule
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [busy],
  );

  const openCreate = () => {
    setEditor(emptyEditor(BUSINESS_TYPE_KEYS[0]));
    setOpen(true);
  };

  const openEdit = (row: PricingRuleRow) => {
    setEditor({
      id: row.id,
      businessType: row.businessType,
      modules: new Set((row.modules as string[]) ?? []),
      setupFeeETB: String(row.setupFeeETB),
      yearlyFeeETB: String(row.yearlyFeeETB),
      description: row.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await upsertPricingRule({
        id: editor.id,
        businessType: editor.businessType,
        modules: [...editor.modules],
        setupFeeETB: Number(editor.setupFeeETB) || 0,
        yearlyFeeETB: Number(editor.yearlyFeeETB) || 0,
        description: editor.description.trim() || null,
        isActive: true,
      });
      toast.success(editor.id ? "Rule updated" : "Rule created");
      setOpen(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const removeRule = async (row: PricingRuleRow) => {
    setBusy(true);
    try {
      await deletePricingRule(row.id);
      toast.success("Pricing rule deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
                <Sparkles className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Pricing snapshot
                  </p>
                  <Badge variant="secondary">All pricing tiers</Badge>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Review every saved pricing tier across business types, including
                  active and inactive catalog rules.
                </p>
              </div>
            </div>

            <Button
              variant="apex"
              className="h-10 shrink-0 cursor-pointer gap-2 self-start rounded-xl px-5 text-sm font-semibold shadow-[0_12px_28px_-16px_oklch(0.55_0.1_195/0.7)] ring-1 ring-[oklch(0.72_0.08_85/0.32)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_16px_32px_-14px_oklch(0.55_0.1_195/0.8)]"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Add pricing rule
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/7 bg-background/55 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Visible rules
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {filtered.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Out of {displayableRules.length} visible catalog rules
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/14 bg-emerald-500/6 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/80">
                Active
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {activeCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Currently available for use
              </p>
            </div>

            <div className="rounded-xl border border-white/7 bg-background/55 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Inactive
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {inactiveCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Preserved for reference or reuse
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="apex-panel-surface overflow-hidden rounded-2xl border border-white/8">
        <ApexDataTable
          data={filtered}
          columns={columns}
          noun="rules"
          pageSize={10}
          showToolbar
          searchPlaceholder="Search rules, modules, fees…"
          rowClassName={(row) =>
            [
              "group/price transition-all duration-150 active:scale-[0.998]",
              !row.isActive ? "opacity-55" : undefined,
            ]
              .filter(Boolean)
              .join(" ")
          }
          emptyState={
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No rules yet. Run the pricing seed script or add a rule.
            </div>
          }
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden border-border/60 p-0 sm:max-w-xl">
          <div className="h-1 w-full bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
            <DialogTitle>{editor.id ? "Edit pricing rule" : "New pricing rule"}</DialogTitle>
            <DialogDescription>
              Fees apply when modules match this set (order-independent).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(58vh,30rem)] min-h-0 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label>Modules in this tier</Label>
                <p className="text-xs text-muted-foreground">
                  Plan name:{" "}
                  <span className="font-medium text-foreground">
                    {planNameFromModules([...editor.modules])}
                  </span>
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {APEX_SUBSCRIPTION_MODULES.map((mod) => (
                  <div
                    key={mod}
                    className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 transition-colors hover:border-[var(--apex-teal)]/40 hover:bg-[var(--apex-teal)]/8 has-[:checked]:border-[var(--apex-teal)]/55 has-[:checked]:bg-[var(--apex-teal)]/12"
                  >
                    <Checkbox
                      id={`price-mod-${mod}`}
                      checked={editor.modules.has(mod)}
                      onCheckedChange={(v) =>
                        setEditor((e) => {
                          const next = new Set(e.modules);
                          if (v) next.add(mod);
                          else next.delete(mod);
                          if (mod === "Sales Role" && v) next.add("Inventory");
                          if (mod === "Inventory" && !v) next.delete("Sales Role");
                          return { ...e, modules: next };
                        })
                      }
                    />
                    <Label
                      htmlFor={`price-mod-${mod}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {mod}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Setup fee (ETB)</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-10"
                  value={editor.setupFeeETB}
                  onChange={(e) =>
                    setEditor((ed) => ({ ...ed, setupFeeETB: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly fee (ETB)</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-10"
                  value={editor.yearlyFeeETB}
                  onChange={(e) =>
                    setEditor((ed) => ({ ...ed, yearlyFeeETB: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                rows={3}
                className="min-h-24 resize-y leading-relaxed"
                value={editor.description}
                onChange={(e) => setEditor((ed) => ({ ...ed, description: e.target.value }))}
                placeholder="Shown in Apex catalog table"
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border/50 bg-black/20 px-6 py-4">
            <Button
              variant="outline"
              className="h-10 cursor-pointer rounded-xl px-4 font-semibold"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="apex"
              disabled={busy}
              className="h-10 cursor-pointer gap-2 rounded-xl px-5 text-sm font-semibold"
              onClick={save}
            >
              {busy ? "Saving…" : editor.id ? "Save rule" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
