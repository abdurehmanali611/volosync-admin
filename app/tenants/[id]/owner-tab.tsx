"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { PendingButton } from "@/components/ui/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapApiError } from "@/lib/admin/core";
import {
  createOwner,
  fetchOwner,
  resetPassword,
  updateOwner,
  type OwnerAccount,
} from "@/lib/admin/platform";
import { dateTimeLabel } from "@/components/apex/platform/ApexQueuePage";

export function OwnerTab({
  tenantId,
  onChanged,
}: {
  tenantId: number;
  onChanged: () => void;
}) {
  const [owner, setOwner] = React.useState<OwnerAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [revealed, setRevealed] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    void fetchOwner(tenantId)
      .then((row) => {
        if (!alive) return;
        setOwner(row);
        setUsername(row?.username ?? "");
        setEmail(row?.email ?? "");
      })
      .catch((e) =>
        toast.error(mapApiError(e, "Could not load the owner account.")),
      )
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) {
      toast.error("Enter an owner username.");
      return;
    }
    if (password.length < 6) {
      toast.error("Use a password of at least 6 characters.");
      return;
    }
    setCreating(true);
    try {
      const next = await createOwner(tenantId, {
        username: username.trim(),
        password,
        email: email.trim() || undefined,
      });
      setOwner(next);
      setPassword("");
      toast.success("Owner account created");
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Could not create the owner account."));
    } finally {
      setCreating(false);
    }
  };

  const saveLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!owner) return;
    if (!username.trim()) {
      toast.error("Enter an owner username.");
      return;
    }
    setSaving(true);
    try {
      const next = await updateOwner(tenantId, {
        username: username.trim(),
        email: email.trim(),
      });
      setOwner(next);
      toast.success("Owner login updated");
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Could not save the owner login."));
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    if (!owner) return;
    if (password && password.length < 6) {
      toast.error("Use at least 6 characters, or leave empty to generate one.");
      return;
    }
    setResetting(true);
    try {
      const result = await resetPassword(owner.id, password || undefined);
      setRevealed(result.password);
      setPassword("");
      toast.success(
        result.generated ? "Temporary password generated" : "Password updated",
      );
      onChanged();
    } catch (e) {
      toast.error(mapApiError(e, "Could not reset the password."));
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <ApexPanel>
        <div className="h-56 animate-pulse rounded-lg bg-white/3" />
      </ApexPanel>
    );
  }

  if (!owner) {
    return (
      <ApexPanel
        title="Owner account"
        description="Create the owner login for this wholesaler."
      >
        <form onSubmit={create} className="space-y-4 px-4 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="owner-username" className="flex items-center gap-1.5">
              <UserRound className="size-3.5 text-muted-foreground" /> Username
            </Label>
            <Input
              id="owner-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="acme-owner"
              className="h-10"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-new-password" className="flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-muted-foreground" /> Password
            </Label>
            <div className="relative">
              <Input
                id="owner-new-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-10 pr-9"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShow((v) => !v)}
                className="absolute right-1 top-1 size-8 cursor-pointer text-muted-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-new-email" className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" /> Email
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="owner-new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@business.et"
              className="h-10"
            />
          </div>
          <PendingButton
            type="submit"
            pending={creating}
            className="w-full cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
          >
            Create owner
          </PendingButton>
        </form>
      </ApexPanel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ApexPanel
        title="Owner account"
        description="The primary login for this wholesaler."
      >
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-apex-emerald/15 text-apex-emerald">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{owner.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                @{owner.username}
              </p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last login</dt>
              <dd>{dateTimeLabel(owner.last_login)}</dd>
            </div>
          </dl>
        </div>
      </ApexPanel>

      <div className="space-y-6">
        <ApexPanel
          title="Owner login"
          description="Username and optional contact email."
        >
          <form onSubmit={saveLogin} className="space-y-3 px-4 py-4 sm:px-6">
            <div className="space-y-1.5">
              <Label htmlFor="owner-username" className="flex items-center gap-1.5">
                <UserRound className="size-3.5 text-muted-foreground" /> Username
              </Label>
              <Input
                id="owner-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="acme-owner"
                className="h-10"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-email" className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Email
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="owner-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@business.et"
                className="h-10"
              />
            </div>
            <PendingButton
              type="submit"
              pending={saving}
              className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
            >
              Save
            </PendingButton>
          </form>
        </ApexPanel>

        <ApexPanel
          title="Reset password"
          description="Shown once — copy it before closing."
        >
          <div className="space-y-3 px-4 py-4 sm:px-6">
            <Label
              htmlFor="owner-password"
              className="flex items-center gap-1.5"
            >
              <KeyRound className="size-3.5 text-muted-foreground" /> New
              password (optional)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="owner-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to generate"
                  className="h-10 pr-9"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-1 top-1 size-8 cursor-pointer text-muted-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <PendingButton
                pending={resetting}
                onClick={doReset}
                variant="outline"
                className="cursor-pointer"
              >
                Reset
              </PendingButton>
            </div>
            {revealed ? (
              <ApexInfoBanner icon={KeyRound}>
                New password: <span className="font-mono">{revealed}</span>
              </ApexInfoBanner>
            ) : null}
          </div>
        </ApexPanel>
      </div>
    </div>
  );
}
