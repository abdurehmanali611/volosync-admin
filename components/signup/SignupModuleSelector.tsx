"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MODULE_OPTIONS,
  type BusinessType,
  type ModuleOption,
} from "@/constants/signup";
import {
  formatETB,
  getSignupDisabledReason,
  isModuleDisabledAtSignup,
  isModuleRequiredAtSignup,
  MODULE_DESCRIPTIONS,
} from "@/lib/signup/subscriptionModules";
import { useSignupPricing } from "@/hooks/useSignupPricing";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function SignupModuleSelector({
  businessType,
  value,
  onChange,
}: {
  businessType: BusinessType;
  value: ModuleOption[];
  onChange: (next: ModuleOption[]) => void;
}) {
  const selected = new Set(value);
  const hasInventory = selected.has("Inventory");
  const hasSales = selected.has("Sales Role");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODULE_OPTIONS.map((mod) => {
        const disabled = isModuleDisabledAtSignup(mod, businessType);
        const required = isModuleRequiredAtSignup(mod, businessType);
        // The Sales Role is an add-on to Inventory: it cannot be checked
        // without it, and Inventory cannot leave while Sales is checked.
        const salesNeedsInventory = mod === "Sales Role" && !hasInventory;
        const inventoryHeldBySales = mod === "Inventory" && hasSales;
        const locked = disabled || salesNeedsInventory || inventoryHeldBySales;
        const checked = selected.has(mod);
        const catalogReason = getSignupDisabledReason(mod, businessType);
        const reason = salesNeedsInventory
          ? "Requires Inventory"
          : inventoryHeldBySales
            ? "Required by Sales Role"
            : catalogReason;

        return (
          <div
            key={mod}
            className={cn(
              "relative flex gap-3 rounded-xl border p-4 transition-colors",
              checked && !locked
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/80 bg-card/80",
              locked && "opacity-80",
            )}
          >
            <Checkbox
              id={`signup-mod-${mod}`}
              checked={checked || required}
              disabled={locked}
              onCheckedChange={(next) => {
                if (locked) return;
                const set = new Set(value);
                if (next === true) {
                  // Checking Sales Role pulls Inventory in automatically.
                  if (mod === "Sales Role") set.add("Inventory");
                  set.add(mod);
                } else {
                  set.delete(mod);
                }
                onChange(
                  MODULE_OPTIONS.filter((m) => set.has(m)) as ModuleOption[],
                );
              }}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor={`signup-mod-${mod}`}
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    !locked && "cursor-pointer",
                  )}
                >
                  {mod}
                </Label>
                {reason ? (
                  <Badge
                    variant={reason === "Included" ? "secondary" : "outline"}
                    className="text-[10px] uppercase tracking-wide"
                  >
                    {reason}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                {MODULE_DESCRIPTIONS[mod]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SignupPricingSummary({
  businessType,
  modules,
}: {
  businessType: BusinessType;
  modules: ModuleOption[];
}) {
  const pricing = useSignupPricing(businessType, modules);
  if (
    !pricing.loading &&
    pricing.setupFeeETB === 0 &&
    pricing.yearlyFeeETB === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
        Select optional modules above to see setup and yearly pricing for this
        wholesaler.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-teal-500/5 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="h-1 bg-linear-to-r from-primary/70 via-emerald-500/60 to-cyan-500/50" />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold tracking-tight">
              VoloSync subscription estimate
            </p>
            <p className="text-xs text-muted-foreground text-pretty">
              {pricing.loading
                ? "Loading current setup and yearly fees…"
                : pricing.differsFromDefault
                  ? "Current rates from the Apex catalog (setup and yearly)."
                  : "One-time setup plus yearly billing."}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Setup fee
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
              {pricing.loading ? "…" : formatETB(pricing.setupFeeETB)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">One-time onboarding</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Yearly fee
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
              {pricing.loading
                ? "…"
                : formatETB(pricing.yearlyFeeETB)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Every 12 months
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
