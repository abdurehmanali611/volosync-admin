"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Lock, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";
import { mapApiError } from "@/lib/admin/core";
import { ApexLogoUpload } from "./ApexLogoUpload";
import {
  createTenant,
  fetchSalesAgents,
  type SalesAgent,
} from "@/lib/admin/platform";

const fieldClass =
  "h-10 w-full border-border/60 bg-background/80 focus-visible:ring-primary/45";

type Option = {
  key: "module_inventory" | "module_hr";
  label: string;
  blurb: string;
};

const MODULE_OPTIONS: Option[] = [
  {
    key: "module_inventory",
    label: "Inventory",
    blurb: "Voucher-lot stock, approvals and sales",
  },
  {
    key: "module_hr",
    label: "HR",
    blurb: "Employees, leave, attendance and payroll",
  },
];

export function ApexCreateTenantDialog({
  trigger,
  children,
  size = "sm",
}: {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [agents, setAgents] = React.useState<SalesAgent[]>([]);

  const [name, setName] = React.useState("");
  const [tin, setTin] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [agent, setAgent] = React.useState<string>("none");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [modules, setModules] = React.useState<Record<Option["key"], boolean>>({
    module_inventory: true,
    module_hr: false,
  });

  React.useEffect(() => {
    if (!open) return;
    void fetchSalesAgents()
      .then((rows) => setAgents(rows.filter((row) => row.active)))
      .catch(() => setAgents([]));
  }, [open]);

  const reset = () => {
    setName("");
    setTin("");
    setLogoUrl("");
    setAgent("none");
    setUsername("");
    setPassword("");
    setModules({ module_inventory: true, module_hr: false });
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Business name is required.");
    if (!tin.trim()) return setError("TIN number is required.");
    if (!username.trim()) return setError("A manager username is required.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setPending(true);
    try {
      const created = await createTenant({
        name: name.trim(),
        tin: tin.trim(),
        username: username.trim(),
        password,
        logo_url: logoUrl || undefined,
        sales_agent: agent === "none" ? null : Number(agent),
        module_inventory: modules.module_inventory,
        module_hr: modules.module_hr,
        sales_role_enabled: false,
      });
      toast.success(`${created.data.name} created`, {
        description: `Manager account: ${created.manager} — sign in on VoloSync.`,
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      setError(mapApiError(e, "Could not create this tenant."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="apex" size={size} className="cursor-pointer">
            <Plus className="mr-2 size-4" />
            {children ?? "New tenant"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border/60 bg-card/98 shadow-2xl backdrop-blur-md sm:max-w-2xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-apex-emerald" />
            Create a tenant
          </DialogTitle>
          <DialogDescription>
            Onboard a wholesaler with its business identity, logo, seller,
            manager login and modules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Business
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-name">Business name</Label>
                <Input
                  id="tenant-name"
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Trading"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-tin">TIN number</Label>
                <Input
                  id="tenant-tin"
                  className={cn(fieldClass, "font-mono tracking-tight")}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="0012345678"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sales agent</Label>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Unattributed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No agent</SelectItem>
                  {agents.map((row) => (
                    <SelectItem key={row.id} value={String(row.id)}>
                      {row.name}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Agents are created and managed in the Sales agents portal.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Branding
            </p>
            <ApexLogoUpload
              value={logoUrl}
              onChange={setLogoUrl}
              disabled={pending}
            />
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Manager account
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="manager-username">Username</Label>
                <Input
                  id="manager-username"
                  className={fieldClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="acme-manager"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager-password">Password</Label>
                <Input
                  id="manager-password"
                  type="password"
                  className={fieldClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Modules
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ModuleTile
                title="Credentials"
                blurb="Accounts, roles and permissions"
                selected
                locked
              />
              {MODULE_OPTIONS.map((option) => (
                <ModuleTile
                  key={option.key}
                  title={option.label}
                  blurb={option.blurb}
                  selected={modules[option.key]}
                  onClick={() =>
                    setModules((prev) => ({
                      ...prev,
                      [option.key]: !prev[option.key],
                    }))
                  }
                />
              ))}
            </div>
          </section>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          <DialogFooter className="gap-2 border-t border-border/40 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <PendingButton
              type="submit"
              pending={pending}
              className="cursor-pointer bg-linear-to-r from-apex-emerald via-[oklch(0.6_0.14_170)] to-apex-teal font-semibold text-white shadow-[0_8px_24px_-8px_var(--apex-emerald-glow)] transition-all hover:brightness-110"
            >
              {pending ? "Creating" : "Create tenant"}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModuleTile({
  title,
  blurb,
  selected,
  locked,
  onClick,
}: {
  title: string;
  blurb: string;
  selected: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-pressed={selected}
      className={cn(
        "group relative rounded-xl border px-3 py-3 text-left transition-all",
        selected
          ? "border-apex-emerald/45 bg-apex-emerald/8 shadow-[inset_0_0_0_1px_var(--apex-emerald-glow)]"
          : "border-border/60 bg-background/40 hover:border-border hover:bg-white/4",
        locked ? "cursor-not-allowed opacity-95" : "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-md border",
            selected
              ? "border-apex-emerald bg-apex-emerald text-white"
              : "border-border/70 bg-transparent",
          )}
        >
          {locked ? (
            <Lock className="size-3" />
          ) : selected ? (
            <Check className="size-3.5" />
          ) : (
            <ShieldCheck className="size-3 opacity-0" />
          )}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {blurb}
      </p>
      {locked ? (
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-apex-emerald/80">
          Included with every plan
        </p>
      ) : null}
    </button>
  );
}
