"use client";

import * as React from "react";
import { CalendarClock, Coins, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { PendingButton } from "@/components/ui/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapApiError } from "@/lib/admin/core";
import { money } from "@/lib/admin/api";
import { updateTenant, type TenantDetail } from "@/lib/admin/platform";
import { dateLabel } from "@/components/apex/platform/ApexQueuePage";

export function BillingTab({
  tenant,
  onChanged,
}: {
  tenant: TenantDetail;
  onChanged: () => void;
}) {
  const [fee, setFee] = React.useState(tenant.annual_fee);
  const [expires, setExpires] = React.useState(
    tenant.subscription_expires_on ?? "",
  );
  const [note, setNote] = React.useState(tenant.subscription_note ?? "");
  const [saving, setSaving] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  const suggestion = tenant.suggested_annual_fee;
  const differs = suggestion !== null && Number(suggestion) !== Number(fee);

  const save = async (
    payload: Record<string, unknown>,
    busy: (v: boolean) => void,
  ) => {
    busy(true);
    try {
      await updateTenant(tenant.id, payload);
      toast.success("Billing updated");
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Could not update billing."));
    } finally {
      busy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ApexPanel
        title="Yearly billing"
        description="VoloSync bills annually — there is no quarterly cycle."
      >
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="annual-fee" className="flex items-center gap-1.5">
              <Coins className="size-3.5 text-muted-foreground" /> Annual fee
              (ETB)
            </Label>
            <Input
              id="annual-fee"
              inputMode="decimal"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="h-10 tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expires" className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-muted-foreground" />{" "}
              Subscription expires
            </Label>
            <Input
              id="expires"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing-note">Note</Label>
            <Input
              id="billing-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bank reference or internal remark"
              className="h-10"
            />
          </div>
          <PendingButton
            pending={saving}
            onClick={() =>
              save(
                {
                  annual_fee: fee,
                  subscription_expires_on: expires || null,
                  subscription_note: note,
                },
                setSaving,
              )
            }
            className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
          >
            Save billing
          </PendingButton>
        </div>
      </ApexPanel>

      <ApexPanel
        title="Fee recalculation"
        description="Derived from the default active pricing plan and this tenant's modules."
      >
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Current fee</dt>
              <dd className="font-semibold tabular-nums">
                {money(tenant.annual_fee)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Suggested fee</dt>
              <dd className="font-semibold tabular-nums text-apex-emerald">
                {suggestion === null ? "No default plan" : money(suggestion)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Next renewal</dt>
              <dd>{dateLabel(tenant.next_renewal_date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last transaction</dt>
              <dd className="font-mono text-xs">
                {tenant.subscription_transaction_id || "—"}
              </dd>
            </div>
          </dl>

          {suggestion === null ? (
            <ApexInfoBanner icon={TriangleAlert}>
              No default active pricing plan exists, so fee recalculation is
              unavailable.
            </ApexInfoBanner>
          ) : differs ? (
            <ApexInfoBanner icon={Sparkles}>
              Applying the suggestion sets the annual fee to{" "}
              <span className="font-mono">{money(suggestion)}</span> based on
              the enabled modules.
            </ApexInfoBanner>
          ) : (
            <ApexInfoBanner icon={Sparkles}>
              The current fee already matches the suggested recalculation.
            </ApexInfoBanner>
          )}

          <Button
            variant="outline"
            disabled={suggestion === null || applying}
            onClick={() => save({ apply_fee: true }, setApplying)}
            className="cursor-pointer"
          >
            {applying ? "Applying…" : "Apply suggested fee"}
          </Button>
        </div>
      </ApexPanel>
    </div>
  );
}
