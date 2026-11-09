"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  createTenantBranch,
  decideBranchRequest,
  fetchBranchRequests,
  fetchPricingRules,
  fetchTenantBranches,
  type BranchRequestRow,
  type PricingRuleRow,
  type TenantBranchItem,
} from "@/lib/apex/actions";
import { formatETB } from "@/lib/apex/analytics";
import { ApexTenantLogo } from "@/components/apex/tenant/ApexTenantLogo";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexApproveRejectActions } from "@/components/apex/layout/ApexApproveRejectActions";
import { AccountStatusBadge } from "@/components/apex/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { Checkbox } from "@/components/ui/checkbox";

const emptyDraft = {
  name: "",
  tin: "",
  username: "",
  password: "",
  module_inventory: true,
  module_hr: true,
  sales_role_enabled: false,
};

type BranchPrice = {
  plan: PricingRuleRow;
  setup: number;
  yearly: number;
  exact: boolean;
};

function sameModules(left: string[], right: string[]) {
  return left.length === right.length && left.every((module) => right.includes(module));
}

/** Mirror of tenants.pricing.suggest_fees: exact plan first, else base + add-ons. */
function priceBranchModules(
  rules: PricingRuleRow[],
  inventory: boolean,
  hr: boolean,
  sales: boolean,
): BranchPrice | null {
  const active = rules.filter((rule) => rule.isActive);
  if (active.length === 0) return null;
  const wanted = [
    inventory ? "Inventory" : null,
    hr ? "HR Module" : null,
    sales ? "Sales Role" : null,
  ].filter((module): module is string => Boolean(module));
  const exact = active.find((rule) => sameModules(rule.modules, wanted));
  const plan = exact ?? active.find((rule) => rule.isDefault) ?? active[0];
  if (!plan) return null;
  const yearly = exact
    ? plan.yearlyFeeETB
    : plan.yearlyFeeETB +
      (inventory ? plan.inventoryYearlyFeeETB ?? 0 : 0) +
      (hr ? plan.hrYearlyFeeETB ?? 0 : 0) +
      (sales ? plan.salesRoleYearlyFeeETB ?? 0 : 0);
  return { plan, setup: plan.setupFeeETB, yearly, exact: Boolean(exact) };
}

export function ApexTenantBranches({
  tenantId,
  tenantTin,
  busy,
  onChanged,
}: {
  tenantId: number;
  tenantTin: string;
  busy: boolean;
  onChanged: () => void;
}) {
  const [branches, setBranches] = useState<TenantBranchItem[]>([]);
  const [requests, setRequests] = useState<BranchRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyRequest, setBusyRequest] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [pricing, setPricing] = useState<PricingRuleRow[]>([]);

  const reload = async () => {
    setLoading(true);
    try {
      const [branchRows, requestRows] = await Promise.all([
        fetchTenantBranches(tenantId),
        fetchBranchRequests({ parentId: tenantId }),
      ]);
      setBranches(branchRows);
      setRequests(requestRows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchPricingRules()
      .then((rows) => {
        if (alive) setPricing(rows.filter((row) => row.isActive));
      })
      .catch(() => {
        if (alive) setPricing([]);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const set = (key: keyof typeof emptyDraft) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const setSwitch =
    (key: "module_inventory" | "module_hr" | "sales_role_enabled") =>
    (checked: boolean) =>
      setDraft((prev) => ({ ...prev, [key]: checked }));

  const decide = async (row: BranchRequestRow, decision: "APPROVED" | "REJECTED", note = "") => {
    setBusyRequest(row.id);
    try {
      await decideBranchRequest(row.id, decision, note);
      toast.success(
        decision === "APPROVED" ? `${row.name} approved` : `${row.name} declined`,
      );
      await reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to decide request");
    } finally {
      setBusyRequest(null);
    }
  };

  const submit = async () => {
    if (!draft.name.trim() || !draft.tin.trim()) {
      toast.error("Branch name and TIN are required");
      return;
    }
    setSaving(true);
    try {
      await createTenantBranch(tenantId, {
        name: draft.name.trim(),
        tin: draft.tin.trim(),
        username: draft.username.trim() || undefined,
        password: draft.password || undefined,
        module_inventory: draft.module_inventory,
        module_hr: draft.module_hr,
        sales_role_enabled: draft.sales_role_enabled,
      });
      toast.success("Branch created");
      setDraft(emptyDraft);
      setOpen(false);
      await reload();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create branch");
    } finally {
      setSaving(false);
    }
  };

  const branchPrice = priceBranchModules(
    pricing,
    draft.module_inventory,
    draft.module_hr,
    draft.sales_role_enabled,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="size-4 text-[var(--apex-teal)]" />
          Branches of {tenantTin}
          <Badge variant="secondary">{branches.length}</Badge>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="apex" className="apex-row-action h-9 gap-2 rounded-xl text-sm cursor-pointer">
              <Plus className="size-4" />
              Create branch
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-0 overflow-hidden border-border/60 p-0 sm:max-w-xl">
            <div className="h-1 w-full bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
            <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
              <DialogTitle className="text-lg tracking-tight">
                Create branch
              </DialogTitle>
              <DialogDescription className="text-pretty leading-relaxed">
                The branch inherits this wholesaler&apos;s modules and VAT rate,
                and signs in with its own manager login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 px-6 py-5">
              <section className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Location
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="flex-col gap-1.5">
                    <FieldLabel htmlFor="branch-name">Branch name</FieldLabel>
                    <Input
                      id="branch-name"
                      value={draft.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder="Bole Branch"
                      className="h-10"
                    />
                  </Field>
                  <Field className="flex-col gap-1.5">
                    <FieldLabel htmlFor="branch-tin">TIN</FieldLabel>
                    <Input
                      id="branch-tin"
                      value={draft.tin}
                      onChange={(e) => set("tin")(e.target.value)}
                      placeholder="Own TIN, not the company TIN"
                      className="h-10"
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Modules
                  <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
                    catalog prices the branch
                  </span>
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["module_inventory", "Inventory"],
                      ["module_hr", "HR Module"],
                      ["sales_role_enabled", "Sales Role"],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSwitch(key)(!draft[key])}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSwitch(key)(!draft[key]);
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm transition-colors hover:border-[var(--apex-teal)]/40 hover:bg-[var(--apex-teal)]/5"
                    >
                      {label}
                      <Checkbox
                        checked={draft[key]}
                        onCheckedChange={setSwitch(key)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[var(--apex-teal)]/25 bg-[var(--apex-teal)]/5 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--apex-teal)]/15 text-[var(--apex-teal)]">
                        <Wallet className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Catalog pricing
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {branchPrice?.plan.modulesKey ?? "No active plan"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {branchPrice
                        ? branchPrice.exact
                          ? "Plan match"
                          : "Base + add-ons"
                        : "Awaiting catalog"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Setup fee
                      </p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {branchPrice ? formatETB(branchPrice.setup) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">one-time</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Yearly fee
                      </p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {branchPrice ? formatETB(branchPrice.yearly) : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">per year</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    {branchPrice
                      ? branchPrice.exact
                        ? `Priced from ${branchPrice.plan.modulesKey} for this module mix.`
                        : `No exact plan match, so the ${branchPrice.plan.modulesKey} base fee plus module add-ons is quoted.`
                      : "No active pricing plan yet — the branch is created with zero fees until Apex prices it."}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Manager login
                  <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
                    optional
                  </span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="flex-col gap-1.5">
                    <FieldLabel htmlFor="branch-username">Username</FieldLabel>
                    <Input
                      id="branch-username"
                      value={draft.username}
                      onChange={(e) => set("username")(e.target.value)}
                      placeholder="Choose a username"
                      autoComplete="off"
                      className="h-10"
                    />
                  </Field>
                  <Field className="flex-col gap-1.5">
                    <FieldLabel htmlFor="branch-password">Password</FieldLabel>
                    <Input
                      id="branch-password"
                      type="password"
                      value={draft.password}
                      onChange={(e) => set("password")(e.target.value)}
                      placeholder="6+ characters"
                      autoComplete="new-password"
                      className="h-10"
                    />
                  </Field>
                </div>
              </section>
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border/50 bg-black/20 px-6 py-4">
              <Button variant="outline" className="h-9 rounded-xl px-4 font-semibold" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <PendingButton variant="apex" pending={saving} onClick={submit} className="h-9 gap-2 rounded-xl px-5 text-sm font-semibold cursor-pointer">
                Create branch
              </PendingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {requests.filter((row) => row.status === "pending").length > 0 ? (
        <ApexPanel className="border-amber-400/20">
          <div className="border-b border-border/50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
              <GitBranch className="size-4" />
              Branch requests waiting on approval
            </p>
          </div>
          <div className="divide-y divide-border/30">
            {requests
              .filter((row) => row.status === "pending")
              .map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      TIN {row.tinNumber} · {row.setupChannel} ·{" "}
                      {row.setupTransactionRef || "no reference"} ·{" "}
                      {row.setupAmountETB.toLocaleString("en-US", {
                        style: "currency",
                        currency: "ETB",
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manager {row.managerUsername || "not set"}
                      {row.managerName ? ` · ${row.managerName}` : ""}
                    </p>
                  </div>
                  <ApexApproveRejectActions
                    busy={busyRequest === row.id}
                    approveLabel="Approve branch"
                    rejectLabel="Decline"
                    rejectTitle={`Decline ${row.name}`}
                    rejectDescription="The owner sees this reason in their Branches tab."
                    onApprove={() => decide(row, "APPROVED")}
                    onReject={(reason) => decide(row, "REJECTED", reason)}
                  />
                </div>
              ))}
          </div>
        </ApexPanel>
      ) : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={4} />
        ) : branches.length === 0 ? (
          <ApexEmptyState
            icon={GitBranch}
            title="No branches yet"
            description="Create a branch to give this wholesaler additional locations."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">TIN</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Account</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ApexTenantLogo name={branch.name} isBranch size={30} />
                      <Link
                        href={`/tenants/${encodeURIComponent(branch.tinNumber)}`}
                        className="truncate font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {branch.name}
                      </Link>
                      {branch.isMain ? <Badge variant="default">Main</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {branch.tinNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{branch.staffCount}</td>
                  <td className="px-4 py-3">
                    <AccountStatusBadge status={branch.accountStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ApexPanel>
    </div>
  );
}
