"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createTenantBranch,
  fetchTenantBranches,
  type TenantBranchItem,
} from "@/lib/apex/actions";
import { ApexTenantLogo } from "@/components/apex/tenant/ApexTenantLogo";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
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

const emptyDraft = {
  name: "",
  tin: "",
  username: "",
  password: "",
};

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
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const reload = async () => {
    setLoading(true);
    try {
      setBranches(await fetchTenantBranches(tenantId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const set = (key: keyof typeof emptyDraft) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

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
