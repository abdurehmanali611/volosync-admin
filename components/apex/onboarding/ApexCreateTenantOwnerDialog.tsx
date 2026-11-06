"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  apexCreateTenantOwner,
  type TenantWithoutOwnerRow,
} from "@/lib/apex/actions";
import {
  tenantPrimaryAccountDescription,
  tenantPrimaryAccountTitle,
  tenantPrimaryRole,
} from "@/lib/signup/subscriptionModules";
import type { BusinessType } from "@/constants/signup";
import { businessTypeLabel } from "@/constants/businessTypes";
import { SignupApexAccessSection } from "@/components/signup/SignupApexAccessSection";
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
import { Separator } from "@/components/ui/separator";

type Props = {
  tenant: TenantWithoutOwnerRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function ApexCreateTenantOwnerDialog({
  tenant,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPaymentReceived, setConfirmPaymentReceived] = useState(true);

  const businessType = (tenant.businessType ?? "Company") as BusinessType;
  const role = tenantPrimaryRole(businessType);

  const submit = async () => {
    if (!userName.trim() || password.length < 6) {
      toast.error("Username and password (6+ chars) are required");
      return;
    }

    setBusy(true);
    try {
      const result = await apexCreateTenantOwner({
        tinNumber: tenant.tinNumber,
        userName: userName.trim(),
        password,
        confirmPaymentReceived,
      });
      toast.success(`${role} ${result.ownerUserName} created`);
      onOpenChange(false);
      onCreated?.();
      router.push(`/tenants/${encodeURIComponent(result.tinNumber)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to create ${role} login`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tenantPrimaryAccountTitle(businessType)}</DialogTitle>
          <DialogDescription>
            {tenant.hotelDisplayName} · {tenant.tinNumber} ·{" "}
            {businessTypeLabel(tenant.businessType)} · creates a {role} role user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {tenantPrimaryAccountTitle(businessType)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tenantPrimaryAccountDescription(businessType)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-userName">{role} username</Label>
                <Input
                  id="primary-userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Choose a username"
                  className="h-11"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-password">{role} password</Label>
                <Input
                  id="primary-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  className="h-11"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Access & billing
              </h2>
            </div>
            <SignupApexAccessSection
              confirmPaymentReceived={confirmPaymentReceived}
              onConfirmPaymentReceivedChange={setConfirmPaymentReceived}
              isIllustrationTenant={false}
              onIllustrationTenantChange={() => {}}
              billingNotes=""
              onBillingNotesChange={() => {}}
              showIllustrationToggle={false}
              showBillingNotes={false}
              roleLabel={role}
            />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? "Creating…" : `Create ${role}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
