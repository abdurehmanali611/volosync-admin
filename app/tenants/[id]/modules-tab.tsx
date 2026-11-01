"use client";

import * as React from "react";
import { Check, Coins, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { Switch } from "@/components/ui/switch";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";
import { mapApiError } from "@/lib/admin/core";
import { money } from "@/lib/admin/api";
import {
  fetchCatalog,
  updateTenant,
  type TenantDetail,
} from "@/lib/admin/platform";

export function ModulesTab({
  tenant,
  onChanged,
}: {
  tenant: TenantDetail;
  onChanged: () => void;
}) {
  const [inventory, setInventory] = React.useState(tenant.module_inventory);
  const [hr, setHr] = React.useState(tenant.module_hr);
  const [salesRole, setSalesRole] = React.useState(tenant.sales_role_enabled);
  const [fees, setFees] = React.useState<{
    inventory: string | null;
    hr: string | null;
    salesRole: string | null;
  }>({
    inventory: null,
    hr: null,
    salesRole: null,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchCatalog()
      .then((catalog) => {
        const byCode = Object.fromEntries(
          catalog.modules.map((m) => [m.code, m]),
        );
        setFees({
          inventory: byCode.INVENTORY?.yearly_fee ?? null,
          hr: byCode.HR?.yearly_fee ?? null,
          salesRole: catalog.sales_role_enabled_fee,
        });
      })
      .catch(() => {});
  }, []);

  const dirty =
    inventory !== tenant.module_inventory ||
    hr !== tenant.module_hr ||
    salesRole !== tenant.sales_role_enabled;

  const save = async (applyFee: boolean) => {
    setSaving(true);
    try {
      const result = await updateTenant(tenant.id, {
        module_inventory: inventory,
        module_hr: hr,
        sales_role_enabled: salesRole,
        ...(applyFee ? { apply_fee: true } : {}),
      });
      toast.success(
        result.fee_applied
          ? `Modules saved · fee set to ${money(result.data.annual_fee)}`
          : "Modules saved",
      );
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Could not save modules."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ApexPanel
        title="Modules"
        description="Credentials is the basic layer and is always enabled."
      >
        <div className="divide-y divide-white/5">
          <ModuleRow
            title="Credentials"
            blurb="Login accounts, roles and permissions"
            enabled
            locked
            fee="Included"
          />
          <ModuleRow
            title="Inventory"
            blurb="Voucher-lot stock, store and finance approvals, promotions and sales"
            enabled={inventory}
            fee={fees.inventory ? `${money(fees.inventory)} / year` : "—"}
            onToggle={() => setInventory((v) => !v)}
          />
          <ModuleRow
            title="HR"
            blurb="Employees, leave, attendance, payroll and the emp/ats companions"
            enabled={hr}
            fee={fees.hr ? `${money(fees.hr)} / year` : "—"}
            onToggle={() => setHr((v) => !v)}
          />
          <ModuleRow
            title="Sales role"
            blurb="Agent logins, stock allocation, settlements and the sales leaderboard"
            enabled={salesRole}
            fee={fees.salesRole ? `${money(fees.salesRole)} / year` : "—"}
            onToggle={() => setSalesRole((v) => !v)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/6 px-4 py-4 sm:px-6">
          <PendingButton
            pending={saving}
            disabled={!dirty}
            onClick={() => save(false)}
            variant="outline"
            className="cursor-pointer"
          >
            Save module changes
          </PendingButton>
          <PendingButton
            pending={saving}
            disabled={!dirty || tenant.suggested_annual_fee === null}
            onClick={() => save(true)}
            className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
          >
            <Sparkles className="mr-2 size-4" />
            Save and recalculate fee
          </PendingButton>
        </div>
      </ApexPanel>

      <ApexInfoBanner icon={Coins}>
        Suggested annual fee after these toggles:{" "}
        <span className="font-mono">
          {tenant.suggested_annual_fee === null
            ? "no default plan"
            : money(tenant.suggested_annual_fee)}
        </span>
        . Fees only change when you choose to recalculate.
      </ApexInfoBanner>
    </div>
  );
}

function ModuleRow({
  title,
  blurb,
  enabled,
  locked,
  fee,
  onToggle,
}: {
  title: string;
  blurb: string;
  enabled: boolean;
  locked?: boolean;
  fee: string;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-apex-emerald/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-apex-emerald">
              <Lock className="size-2.5" /> Always on
            </span>
          ) : null}
          {enabled && !locked ? (
            <Check className="size-3.5 text-apex-emerald" />
          ) : null}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{blurb}</p>
        <p className="text-xs tabular-nums text-muted-foreground/80">{fee}</p>
      </div>
      <Switch
        checked={enabled}
        disabled={locked}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${title}`}
        className={cn(locked && "cursor-not-allowed opacity-70")}
      />
    </div>
  );
}
