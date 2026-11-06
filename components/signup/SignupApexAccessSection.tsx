"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BadgeCheck } from "lucide-react";

export function SignupApexAccessSection({
  confirmPaymentReceived,
  onConfirmPaymentReceivedChange,
  isIllustrationTenant,
  onIllustrationTenantChange,
  billingNotes,
  onBillingNotesChange,
  showIllustrationToggle = true,
  showBillingNotes = true,
  roleLabel = "Admin or Manager",
}: {
  confirmPaymentReceived: boolean;
  onConfirmPaymentReceivedChange: (v: boolean) => void;
  isIllustrationTenant: boolean;
  onIllustrationTenantChange: (v: boolean) => void;
  billingNotes: string;
  onBillingNotesChange: (v: string) => void;
  showIllustrationToggle?: boolean;
  showBillingNotes?: boolean;
  roleLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">Apex handles payment separately</p>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            No payment reference is collected here. Confirm below when the customer
            has already paid so their account is active immediately.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 px-4 py-3">
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="confirm-payment" className="text-sm font-semibold">
            Payment received
          </Label>
          <p className="text-xs text-muted-foreground">
            Approve setup immediately — {roleLabel} can log in to volosync
          </p>
        </div>
        <Switch
          id="confirm-payment"
          checked={confirmPaymentReceived}
          onCheckedChange={onConfirmPaymentReceivedChange}
        />
      </div>

      {showIllustrationToggle ? (
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 px-4 py-3">
          <div className="space-y-0.5 pr-4">
            <Label htmlFor="illustration-tenant" className="text-sm font-semibold">
              Illustration / demo tenant
            </Label>
            <p className="text-xs text-muted-foreground">No billing enforcement</p>
          </div>
          <Switch
            id="illustration-tenant"
            checked={isIllustrationTenant}
            onCheckedChange={onIllustrationTenantChange}
          />
        </div>
      ) : null}

      {showBillingNotes ? (
        <div className="space-y-2">
          <Label htmlFor="billing-notes">Internal billing notes (optional)</Label>
          <Textarea
            id="billing-notes"
            value={billingNotes}
            onChange={(e) => onBillingNotesChange(e.target.value)}
            placeholder="Discount reason, special terms, payment method used…"
            rows={2}
          />
        </div>
      ) : null}
    </div>
  );
}
