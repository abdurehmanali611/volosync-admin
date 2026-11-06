"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Link2,
  Loader2,
  Pencil,
  Trash2,
  UserCircle2,
  UserPlus,
} from "lucide-react";
import {
  apexCreateOwnerAccount,
  apexLinkOwnerProperty,
  deletePortfolioOwner,
  fetchOwnerAccounts,
  fetchPortfolioOwner,
  updatePortfolioOwner,
  type OwnerAccountRow,
  type PortfolioOwnerRow,
} from "@/lib/apex/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton } from "@/components/ui/pending-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApexTenantTabShell } from "@/components/apex/tenant/ApexTenantTabShell";
import { cn } from "@/lib/utils";

type Props = {
  tinNumber: string;
  hotelDisplayName: string;
};

export function ApexPortfolioOwnerPanel({ tinNumber, hotelDisplayName }: Props) {
  const [owner, setOwner] = useState<PortfolioOwnerRow | null>(null);
  const [accounts, setAccounts] = useState<OwnerAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(hotelDisplayName);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const canCreate = userName.trim().length > 0 && password.length >= 6;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [current, list] = await Promise.all([
        fetchPortfolioOwner(tinNumber).catch(() => null),
        fetchOwnerAccounts().catch(() => [] as OwnerAccountRow[]),
      ]);
      setOwner(current);
      setAccounts(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load owner accounts");
    } finally {
      setLoading(false);
    }
  }, [tinNumber]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openEdit = () => {
    if (!owner) return;
    setEditUserName(owner.userName);
    setEditEmail(owner.email);
    setEditPassword("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUserName.trim()) {
      toast.error("Username is required");
      return;
    }
    if (editPassword.trim() && editPassword.trim().length < 6) {
      toast.error("Use a password of at least 6 characters");
      return;
    }
    setSavingEdit(true);
    try {
      setOwner(
        await updatePortfolioOwner(tinNumber, {
          userName: editUserName,
          email: editEmail,
          password: editPassword.trim() || undefined,
        }),
      );
      toast.success("Owner account updated");
      setEditOpen(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeOwner = async () => {
    setDeleting(true);
    try {
      await deletePortfolioOwner(tinNumber);
      toast.success("Owner account deleted");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const linkExisting = async () => {
    const id = Number(selectedId);
    if (!id) {
      toast.error("Select an owner account");
      return;
    }
    setBusy(true);
    try {
      await apexLinkOwnerProperty(id, tinNumber, hotelDisplayName);
      toast.success("Wholesaler linked to portfolio owner");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Link failed");
    } finally {
      setBusy(false);
    }
  };

  const createAndLink = async () => {
    if (!userName.trim() || password.length < 6) {
      toast.error("Username and password (6+ chars) are required");
      return;
    }
    setBusy(true);
    try {
      await apexCreateOwnerAccount({
        userName: userName.trim(),
        password,
        displayName: displayName.trim() || hotelDisplayName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        linkTinNumber: tinNumber,
      });
      toast.success("Portfolio owner created and linked");
      setUserName("");
      setPassword("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ApexTenantTabShell
      title="Portfolio owner"
      description="Separate volosync-owner app login for business owners — not the tenant Admin/Manager credential."
      icon={UserCircle2}
      tone="slate"
    >
      <div className="space-y-6">
        {owner ? (
          <>
            <section className="overflow-hidden rounded-2xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.35)] via-[oklch(0.22_0.03_265/0.35)] to-[oklch(0.32_0.05_85/0.2)]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.62_0.1_195/0.22)] ring-1 ring-[oklch(0.72_0.08_85/0.3)]">
                    <UserCircle2 className="size-5 text-[oklch(0.8_0.05_195)]" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-semibold leading-tight">
                      {owner.displayName || owner.userName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Portfolio owner login for this wholesaler.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="apex-row-action h-9 cursor-pointer gap-1.5 rounded-xl"
                    onClick={openEdit}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="apex-row-action h-9 cursor-pointer gap-1.5 rounded-xl text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete owner account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the{" "}
                          <span className="font-medium text-foreground">
                            {owner.userName}
                          </span>{" "}
                          portfolio owner login and signs them out of the owner app.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          className="rounded-xl font-semibold"
                          onSelect={(e) => {
                            e.preventDefault();
                            void removeOwner();
                          }}
                        >
                          {deleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <dl className="grid gap-px border-t border-white/8 bg-white/6 sm:grid-cols-3">
                <div className="space-y-1 bg-black/25 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Username
                  </dt>
                  <dd className="truncate text-sm font-medium">{owner.userName}</dd>
                </div>
                <div className="space-y-1 bg-black/25 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </dt>
                  <dd className="truncate text-sm font-medium">
                    {owner.email || "—"}
                  </dd>
                </div>
                <div className="space-y-1 bg-black/25 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Last login
                  </dt>
                  <dd className="truncate text-sm font-medium">
                    {owner.lastLogin
                      ? new Date(owner.lastLogin).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
              </dl>
            </section>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="gap-0 overflow-hidden border-border/60 p-0 sm:max-w-md">
                <div className="h-1 w-full bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
                <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
                  <DialogTitle>Edit owner account</DialogTitle>
                  <DialogDescription>
                    Update the portfolio owner&apos;s login, contact email and password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 px-6 py-5">
                  <div className="space-y-2">
                    <Label htmlFor="owner-edit-username">Username</Label>
                    <Input
                      id="owner-edit-username"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      autoComplete="off"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-edit-email">Email</Label>
                    <Input
                      id="owner-edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-10"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-edit-password">New password</Label>
                    <Input
                      id="owner-edit-password"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      autoComplete="new-password"
                      className="h-10"
                      placeholder="Leave blank to keep the current password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only used when you want to reset the owner&apos;s password.
                    </p>
                  </div>
                </div>
                <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border/50 bg-black/20 px-6 py-4">
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl px-4 font-semibold"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <PendingButton
                    variant="apex"
                    pending={savingEdit}
                    onClick={saveEdit}
                    className="h-9 rounded-xl px-5 text-sm font-semibold cursor-pointer"
                  >
                    Save changes
                  </PendingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
        <section className="space-y-3 rounded-xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[oklch(0.75_0.04_85)]" />
            <h3 className="text-sm font-semibold">Link existing owner</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={loading || accounts.length === 0}
            >
              <SelectTrigger className="sm:flex-1">
                <SelectValue
                  placeholder={loading ? "Loading…" : "Select owner account"}
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.userName}
                    {a.displayName ? ` — ${a.displayName}` : ""} ({a.propertyCount}{" "}
                    wholesalers)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="apex-row-action shrink-0"
              onClick={() => void linkExisting()}
              disabled={busy || !selectedId}
            >
              Link to wholesaler
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[oklch(0.72_0.08_195)]" />
            <h3 className="text-sm font-semibold">Create new portfolio owner</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="po-userName">Username</Label>
              <Input
                id="po-userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="off"
                className="h-11"
                placeholder="owner.login"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-password">Password</Label>
              <Input
                id="po-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-displayName">Display name</Label>
              <Input
                id="po-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-phone">Phone (optional)</Label>
              <Input
                id="po-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-email">Email (optional)</Label>
              <Input
                id="po-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.35)] via-[oklch(0.22_0.03_265/0.5)] to-[oklch(0.32_0.05_85/0.22)] p-4 sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[oklch(0.62_0.1_195/0.2)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[oklch(0.72_0.08_85/0.16)] blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Ready to create & link
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {canCreate ? (
                    <>
                      Creates{" "}
                      <span className="font-medium text-foreground/90">
                        {userName.trim()}
                      </span>{" "}
                      and links them to this wholesaler in one step.
                    </>
                  ) : (
                    <>
                      Enter a username and a password with at least 6 characters
                      to enable create & link.
                    </>
                  )}
                </p>
              </div>

              <Button
                type="button"
                variant="apex"
                size="lg"
                disabled={busy || !canCreate}
                onClick={() => void createAndLink()}
                className={cn(
                  "relative h-12 min-w-54 shrink-0 gap-2.5 rounded-xl px-5",
                  "shadow-[0_12px_28px_-12px_oklch(0.55_0.1_195/0.65)]",
                  "ring-1 ring-[oklch(0.72_0.08_85/0.35)]",
                  "transition-all duration-200",
                  "hover:shadow-[0_16px_32px_-10px_oklch(0.55_0.1_195/0.75)]",
                  "hover:brightness-110",
                  canCreate && !busy && "animate-[apex-cta-glow_2.8s_ease-in-out_infinite]",
                )}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <span className="flex items-center -space-x-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 ring-1 ring-black/10">
                        <UserPlus className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 ring-1 ring-black/10">
                        <Link2 className="h-3.5 w-3.5" />
                      </span>
                    </span>
                    Create & link owner
                    <ArrowRight className="h-4 w-4 opacity-80" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </ApexTenantTabShell>
  );
}
