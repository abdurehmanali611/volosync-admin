"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers3, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  ApexTenantMetricTile,
  ApexTenantTabShell,
} from "@/components/apex/tenant/ApexTenantTabShell";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";
import {
  fetchPricingRules,
  suggestFeesForModules,
} from "@/lib/apex/actions";
import type { PricingRuleRow, TenantDetail } from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

function formatEtb(n: number) {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

type Props = {
  tenant: TenantDetail;
  busy: boolean;
  onSaveModules: (modules: string[], recalcFees: boolean) => void;
  onSyncStaff: () => void;
};

export function ApexTenantModulesEditor({
  tenant,
  busy,
  onSaveModules,
  onSyncStaff,
}: Props) {
  const initial = useMemo(
    () => new Set((tenant.modules as string[]) ?? []),
    [tenant.modules, tenant.tinNumber],
  );
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [recalcOnSave, setRecalcOnSave] = useState(!tenant.feesManuallySet);
  const [rules, setRules] = useState<PricingRuleRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchPricingRules()
      .then((rows) => {
        if (alive) setRules(rows);
      })
      .catch(() => {
        if (alive) setRules([]);
      });
    return () => {
      alive = false;
    };
  }, [tenant.tinNumber]);
  const draftFees = useMemo(
    () => (rules ? suggestFeesForModules(rules, [...selected]) : null),
    [rules, selected],
  );
  const toggle = (mod: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(mod);
      else next.delete(mod);
      return next;
    });
  };

  return (
    <ApexTenantTabShell
      title="Modules"
      description="Toggle product modules for this wholesaler. Catalog fees follow the selected mix."
      icon={Layers3}
      tone="teal"
      actions={
        <Badge variant="outline">
          {selected.size} selected
        </Badge>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <ApexTenantMetricTile
            label="Catalog setup"
            value={formatEtb(
              draftFees ? draftFees.setupFeeETB : tenant.suggestedSetupFeeETB,
            )}
            sub={draftFees ? `From ${draftFees.planName}` : "For current module mix"}
          />
          <ApexTenantMetricTile
            label="Catalog yearly"
            value={formatEtb(
              draftFees ? draftFees.yearlyFeeETB : tenant.suggestedYearlyFeeETB,
            )}
            sub={
              tenant.feesManuallySet
                ? "Custom fees locked until recalc"
                : draftFees
                  ? draftFees.exact
                    ? `${draftFees.planName} · exact match`
                    : `${draftFees.planName} + module add-ons`
                  : "Auto-sync on save"
            }
          />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {APEX_SUBSCRIPTION_MODULES.map((mod) => {
            const checked = selected.has(mod);
            return (
              <label
                key={mod}
                htmlFor={`mod-${mod}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                  checked
                    ? "border-[oklch(0.62_0.1_195/0.35)] bg-[oklch(0.45_0.05_195/0.12)]"
                    : "border-white/8 bg-white/3 hover:border-white/14 hover:bg-white/5",
                )}
              >
                <Checkbox
                  id={`mod-${mod}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(mod, Boolean(v))}
                />
                <span className="text-sm font-medium">{mod}</span>
              </label>
            );
          })}
        </div>

        {tenant.feesManuallySet ? (
          <label
            htmlFor="recalc-fees"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">Recalculate fees on save</p>
              <p className="text-xs text-muted-foreground">
                Update setup & yearly from catalog when modules change
              </p>
            </div>
            <Switch
              id="recalc-fees"
              checked={recalcOnSave}
              onCheckedChange={setRecalcOnSave}
            />
          </label>
        ) : (
          <Badge variant="outline">Fees auto-sync with catalog on save</Badge>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="apex"
            className="apex-row-action cursor-pointer"
            disabled={busy}
            onClick={() => onSaveModules([...selected], recalcOnSave)}
          >
            Save modules
            {recalcOnSave ? " & recalc fees" : ""}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="apex-row-action cursor-pointer gap-1.5"
            disabled={busy}
            onClick={onSyncStaff}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync staff modules from owner
          </Button>
        </div>
      </div>
    </ApexTenantTabShell>
  );
}
