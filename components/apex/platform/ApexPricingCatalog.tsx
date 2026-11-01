"use client";

import * as React from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import {
  BadgePercent,
  Check,
  Coins,
  Lock,
  PencilLine,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexPillTabs } from "@/components/apex/platform/ApexPillTabs";

import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";
import { mapApiError } from "@/lib/admin/core";
import { money } from "@/lib/admin/api";
import { deletePricingPlan, type PricingPlan } from "@/lib/admin/platform";


export type Draft = {
  id?: number;
  name: string;
  setup_fee: string;
  yearly_base_fee: string;
  inventory_yearly_fee: string;
  hr_yearly_fee: string;
  sales_role_yearly_fee: string;
  is_default: boolean;
  active: boolean;
};

export const EMPTY_DRAFT: Draft = {
  name: "",
  setup_fee: "0",
  yearly_base_fee: "0",
  inventory_yearly_fee: "0",
  hr_yearly_fee: "0",
  sales_role_yearly_fee: "0",
  is_default: false,
  active: true,
};

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-apex-emerald/25 bg-apex-emerald/10 px-2.5 py-1 text-xs font-semibold text-apex-emerald">
      <span className="size-2 rounded-full bg-apex-emerald shadow-[0_0_0_3px_var(--apex-emerald-glow)]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <span className="size-2 rounded-full bg-muted-foreground/70" />
      Inactive
    </span>
  );
}

function ModuleChips({
  plan,
  compact,
}: {
  plan: PricingPlan;
  compact?: boolean;
}) {
  const items = [
    { label: "Credentials", value: "Included", locked: true },
    { label: "Inventory", value: money(plan.inventory_yearly_fee) },
    { label: "HR", value: money(plan.hr_yearly_fee) },
    { label: "Sales role", value: money(plan.sales_role_yearly_fee) },
  ];
  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
            item.locked
              ? "border-apex-emerald/25 bg-apex-emerald/10 text-apex-emerald"
              : "border-white/8 bg-white/4 text-muted-foreground",
          )}
        >
          {item.locked ? <Lock className="size-2.5" /> : null}
          {item.label}
          {compact ? null : (
            <span className="tabular-nums opacity-80">· {item.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function ApexPricingCatalog({
  plans,
  loading,
  onChanged,
  onCreate,
}: {
  plans: PricingPlan[];
  loading: boolean;
  onChanged: () => void;
  onCreate: () => void;
}) {
  const [filter, setFilter] = React.useState("all");
  const [editing, setEditing] = React.useState<PricingPlan | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(
    () =>
      filter === "all"
        ? plans
        : filter === "active"
          ? plans.filter((p) => p.active)
          : filter === "default"
            ? plans.filter((p) => p.is_default)
            : plans.filter((p) => !p.active),
    [plans, filter],
  );

  const activeCount = plans.filter((p) => p.active).length;
  const defaultPlan = plans.find((p) => p.is_default);

  const remove = async (plan: PricingPlan) => {
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(`Delete "${plan.name}"? This cannot be undone.`);
    if (!ok) return;
    setBusy(true);
    try {
      await deletePricingPlan(plan.id);
      toast.success("Plan deleted");
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Delete failed"));
    } finally {
      setBusy(false);
    }
  };

  const columns = React.useMemo<LegacyColumnDef<PricingPlan, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{row.original.name}</p>
              {row.original.is_default ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-apex-emerald/15 text-[10px] font-semibold uppercase text-apex-emerald"
                >
                  <Star className="mr-1 size-2.5" /> Default
                </Badge>
              ) : null}
            </div>
            <ModuleChips plan={row.original} />
          </div>
        ),
      },
      {
        accessorKey: "setup_fee",
        header: () => <div className="text-right">Setup</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {money(row.original.setup_fee)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              One-time onboarding
            </p>
          </div>
        ),
      },
      {
        accessorKey: "yearly_base_fee",
        header: () => <div className="text-right">Yearly base</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-apex-emerald">
              {money(row.original.yearly_base_fee)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Recurring every 12 months
            </p>
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => <StatusPill active={row.original.active} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="cursor-pointer rounded-lg px-3"
              onClick={() => setEditing(row.original)}
            >
              <PencilLine className="size-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="cursor-pointer rounded-lg border-destructive/25 px-3 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
              onClick={() => remove(row.original)}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy],
  );

  return (
    <div className="space-y-5">
      {/* Hero summary — mirrors hotcol's catalog banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-apex-emerald/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-apex-emerald/20 bg-apex-emerald/8 p-2.5">
              <BadgePercent className="size-4.5 text-apex-emerald" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">
                  Yearly billing catalog
                </p>
                {defaultPlan ? (
                  <Badge variant="secondary">
                    Default · {defaultPlan.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-apex-amber">
                    No default plan
                  </Badge>
                )}
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Setup and yearly fees per module. Credentials is the basic layer
                — always included, never billable, never a requestable
                candidate.
              </p>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2.5">
            <Tile label="Plans" value={plans.length} />
            <Tile label="Active" value={activeCount} tone="emerald" />
            <Tile label="Inactive" value={plans.length - activeCount} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ApexPillTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All plans", count: plans.length },
            { value: "active", label: "Active", count: activeCount },
            {
              value: "default",
              label: "Default",
              count: plans.filter((p) => p.is_default).length,
            },
            {
              value: "inactive",
              label: "Inactive",
              count: plans.length - activeCount,
            },
          ]}
        />
        <Button
          variant="apex"
          size="sm"
          onClick={onCreate}
          className="cursor-pointer"
        >
          <Plus className="mr-2 size-4" /> New plan
        </Button>
      </div>

      <ApexPanel>
        {filtered.length === 0 && !loading ? (
          <ApexEmptyState
            icon={Coins}
            title={
              plans.length === 0
                ? "No pricing plans yet"
                : "Nothing in this view"
            }
            description={
              plans.length === 0
                ? "Create the first plan so tenant fees can be calculated automatically."
                : "Switch tabs or clear the filter to see other plans."
            }
            action={
              <Button
                variant="apex"
                onClick={onCreate}
                className="cursor-pointer"
              >
                New plan
              </Button>
            }
          />
        ) : (
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="plans"
            pageSize={10}
            showToolbar={false}
          />
        )}
      </ApexPanel>

      <PlanDetailSheet plan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald";
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          tone === "emerald" && "text-apex-emerald",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PlanDetailSheet({
  plan,
  onClose,
}: {
  plan: PricingPlan | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={plan !== null}
      onOpenChange={(open) => (open ? null : onClose())}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{plan?.name ?? "Plan"}</SheetTitle>
          <SheetDescription>
            Fees and included modules for this catalog entry.
          </SheetDescription>
        </SheetHeader>
        {plan ? (
          <div className="space-y-5 px-4 pb-6">
            <div className="flex items-center justify-between">
              <StatusPill active={plan.active} />
              {plan.is_default ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-apex-emerald/15 text-[10px] uppercase text-apex-emerald"
                >
                  <Star className="mr-1 size-2.5" /> Default
                </Badge>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/25 p-4 text-sm">
              <div>
                <dt className="text-[11px] text-muted-foreground">Setup fee</dt>
                <dd className="font-semibold tabular-nums">
                  {money(plan.setup_fee)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">
                  Yearly base
                </dt>
                <dd className="font-semibold tabular-nums text-apex-emerald">
                  {money(plan.yearly_base_fee)}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Module fees
              </p>
              <ul className="space-y-1.5 text-sm">
                <FeeRow
                  label="Inventory"
                  value={money(plan.inventory_yearly_fee)}
                />
                <FeeRow label="HR" value={money(plan.hr_yearly_fee)} />
                <FeeRow
                  label="Sales role"
                  value={money(plan.sales_role_yearly_fee)}
                />
                <FeeRow
                  label="Credentials"
                  value="Included — always on"
                  locked
                />
              </ul>
            </div>

            <div className="rounded-xl border border-apex-emerald/20 bg-apex-emerald/6 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-apex-emerald">
                <Sparkles className="size-3.5" /> Recalculation source
              </p>
              The default active plan drives suggested fees on tenant billing
              and module tabs.
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function FeeRow({
  label,
  value,
  locked,
}: {
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-white/5 pb-1.5 last:border-0">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {locked ? (
          <Lock className="size-3 text-apex-emerald" />
        ) : (
          <Check className="size-3 opacity-40" />
        )}
        {label}
      </span>
      <span className={cn("tabular-nums", locked && "text-apex-emerald")}>
        {value}
      </span>
    </li>
  );
}

export function PlanEditorDialog({
  draft,
  setDraft,
  saving,
  onSubmit,
}: {
  draft: Draft | null;
  setDraft: (next: Draft | null) => void;
  saving: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={draft !== null}
      onOpenChange={(open) => (open ? null : setDraft(null))}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {draft?.id ? "Edit plan" : "New pricing plan"}
          </DialogTitle>
          <DialogDescription>
            Fees are yearly, in ETB. Making a plan default clears the flag on
            the others.
          </DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="space-y-3">
            <Field
              label="Plan name"
              value={draft.name}
              onChange={(v) => setDraft({ ...draft, name: v })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Setup fee"
                value={draft.setup_fee}
                onChange={(v) => setDraft({ ...draft, setup_fee: v })}
              />
              <Field
                label="Yearly base fee"
                value={draft.yearly_base_fee}
                onChange={(v) => setDraft({ ...draft, yearly_base_fee: v })}
              />
              <Field
                label="Inventory / year"
                value={draft.inventory_yearly_fee}
                onChange={(v) =>
                  setDraft({ ...draft, inventory_yearly_fee: v })
                }
              />
              <Field
                label="HR / year"
                value={draft.hr_yearly_fee}
                onChange={(v) => setDraft({ ...draft, hr_yearly_fee: v })}
              />
              <Field
                label="Sales role / year"
                value={draft.sales_role_yearly_fee}
                onChange={(v) =>
                  setDraft({ ...draft, sales_role_yearly_fee: v })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2.5">
              <Label htmlFor="plan-default">Default plan</Label>
              <Switch
                id="plan-default"
                checked={draft.is_default}
                onCheckedChange={(v) => setDraft({ ...draft, is_default: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2.5">
              <Label htmlFor="plan-active">Active</Label>
              <Switch
                id="plan-active"
                checked={draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setDraft(null)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <PendingButton
            pending={saving}
            onClick={onSubmit}
            className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
          >
            {draft?.id ? "Save plan" : "Create plan"}
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 tabular-nums"
      />
    </div>
  );
}
