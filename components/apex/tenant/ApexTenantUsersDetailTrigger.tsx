"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Users } from "lucide-react";
import { isInternalLogin, type TenantUserMonitoringRow } from "@/lib/apex/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { businessTypeLabel } from "@/constants/businessTypes";
import { cn } from "@/lib/utils";

export type TenantUsersGroup = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string;
  roleCount: number;
  roles: string[];
  userCount: number;
  disabledCount: number;
  pays: boolean;
  standingLabel: string;
  subscriptionStatus: string | null;
  accountStatus: string | null;
  isIllustrationTenant: boolean;
  users: TenantUserMonitoringRow[];
};

/** Third meta segment: Banned / Suspended / Pays / Doesn't pay */
export function tenantStandingLabel(input: {
  accountStatus?: string | null;
  subscriptionStatus?: string | null;
  isIllustrationTenant?: boolean;
}): string {
  const account = String(input.accountStatus || "").trim().toLowerCase();
  if (account === "banned") return "Banned";
  if (account === "suspended") return "Suspended";

  const subscription = String(input.subscriptionStatus || "").trim().toLowerCase();
  if (input.isIllustrationTenant || subscription === "exempt") {
    return "Doesn't pay";
  }

  if (
    subscription === "active" ||
    subscription === "warning" ||
    subscription === "trial"
  ) {
    return "Pays";
  }

  return "Doesn't pay";
}

export function tenantUsersMetaLine(group: TenantUsersGroup) {
  return `${businessTypeLabel(group.businessType)} · ${group.roleCount} ${
    group.roleCount === 1 ? "role" : "roles"
  } · ${group.standingLabel}`;
}

function usersGroupedByRole(users: TenantUserMonitoringRow[]) {
  const map = new Map<string, TenantUserMonitoringRow[]>();
  for (const user of users) {
    const key = String(user.role || "").trim() || "Unassigned";
    const list = map.get(key);
    if (list) list.push(user);
    else map.set(key, [user]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function initialsOf(value: string) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  return (parts[0].slice(0, 1) + (parts[1]?.slice(0, 1) ?? "")).toUpperCase();
}

function UserDetailCard({ user }: { user: TenantUserMonitoringRow }) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-border/60 bg-linear-to-br from-card/90 to-muted/35 px-3 py-2.5 transition-all duration-150 hover:border-[var(--apex-teal)]/45 hover:shadow-[0_10px_24px_-18px_oklch(0.55_0.1_195/0.8)]">
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--apex-teal)]/14 text-[11px] font-semibold text-[var(--apex-teal)] ring-1 ring-[var(--apex-teal)]/25">
            {initialsOf(user.displayName)}
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium wrap-break-word">{user.displayName}</p>
            {!isInternalLogin(user.userName) ? (
              <p className="text-[11px] text-muted-foreground wrap-break-word">
                Login: <span className="text-foreground/80">{user.userName}</span>
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground wrap-break-word">
              Role: <span className="text-foreground/90">{user.role || "—"}</span>
            </p>
            {user.loginDisabled && user.loginDisabledReason ? (
              <p className="text-[11px] text-destructive/90 wrap-break-word">
                {user.loginDisabledReason}
              </p>
            ) : null}
          </div>
        </div>
        {user.loginDisabled ? (
          <Badge variant="destructive" className="w-fit shrink-0 text-[10px] font-normal">
            Disabled
          </Badge>
        ) : (
          <Badge variant="success" className="w-fit shrink-0 text-[10px] font-normal">
            Active
          </Badge>
        )}
      </div>
    </div>
  );
}

function TenantIdentity({ group }: { group: TenantUsersGroup }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold wrap-break-word">{group.hotelDisplayName}</p>
      <p className="text-[11px] leading-snug text-muted-foreground wrap-break-word">
        {tenantUsersMetaLine(group)}
      </p>
    </div>
  );
}

function PreviewBody({ group }: { group: TenantUsersGroup }) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.32)] via-[oklch(0.22_0.03_265/0.3)] to-[oklch(0.32_0.05_85/0.18)] p-3">
        <div className="pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full bg-[oklch(0.62_0.1_195/0.2)] blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <TenantIdentity group={group} />
          <Badge
            variant="outline"
            className="shrink-0 border-[var(--apex-gold)]/40 bg-[var(--apex-gold)]/12 text-[var(--apex-gold)]"
          >
            {group.userCount} user{group.userCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <div className="relative mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/8 bg-white/6 text-[11px]">
          <div className="min-w-0 space-y-0.5 bg-black/25 px-2.5 py-2">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              TIN
            </p>
            <p className="font-mono break-all text-foreground/90">{group.tinNumber}</p>
          </div>
          <div className="min-w-0 space-y-0.5 bg-black/25 px-2.5 py-2">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              Standing
            </p>
            <p className="wrap-break-word text-foreground/90">
              {group.standingLabel}
              {group.isIllustrationTenant ? " · illustration" : ""}
            </p>
          </div>
          <div className="col-span-2 min-w-0 space-y-1 bg-black/25 px-2.5 py-2">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              Roles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.roles.length > 0 ? (
                group.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-md border border-[var(--apex-teal)]/30 bg-[var(--apex-teal)]/12 px-1.5 py-0.5 text-[10px] font-medium text-[var(--apex-teal)]"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-foreground/70">—</span>
              )}
            </div>
          </div>
          <div className="col-span-2 min-w-0 space-y-0.5 bg-black/25 px-2.5 py-2">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              Login
            </p>
            <p
              className={cn(
                "wrap-break-word",
                group.disabledCount > 0
                  ? "text-destructive"
                  : "text-[var(--apex-success)]",
              )}
            >
              {group.disabledCount > 0
                ? `${group.disabledCount} disabled · ${group.userCount - group.disabledCount} active`
                : "All active"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-border/50 bg-card/45 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Users className="h-3.5 w-3.5 shrink-0 text-[var(--apex-teal)]" />
          Staff accounts
        </div>
        {group.users.map((user) => (
          <UserDetailCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function SheetBody({ group }: { group: TenantUsersGroup }) {
  const byRole = usersGroupedByRole(group.users);
  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[oklch(0.62_0.1_195/0.28)] bg-linear-to-br from-[oklch(0.28_0.04_195/0.32)] via-[oklch(0.22_0.03_265/0.34)] to-[oklch(0.32_0.05_85/0.2)] p-4">
        <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[oklch(0.62_0.1_195/0.18)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-[oklch(0.72_0.08_85/0.14)] blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <TenantIdentity group={group} />
          <Badge
            variant="outline"
            className="shrink-0 border-[var(--apex-gold)]/40 bg-[var(--apex-gold)]/12 text-[var(--apex-gold)]"
          >
            {group.userCount} user{group.userCount === 1 ? "" : "s"}
          </Badge>
        </div>

        <dl className="relative grid w-full min-w-0 grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/6 text-sm sm:grid-cols-2">
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              TIN
            </dt>
            <dd className="font-mono text-xs font-medium break-all">
              {group.tinNumber}
            </dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Business type
            </dt>
            <dd className="font-medium wrap-break-word">
              {businessTypeLabel(group.businessType)}
            </dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Roles
            </dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {group.roleCount} {group.roleCount === 1 ? "role" : "roles"}
              </span>
              {group.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-md border border-[var(--apex-teal)]/30 bg-[var(--apex-teal)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--apex-teal)]"
                >
                  {role}
                </span>
              ))}
            </dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Standing
            </dt>
            <dd className="font-medium wrap-break-word">
              {group.standingLabel}
              {group.isIllustrationTenant ? " · illustration tenant" : ""}
              {group.subscriptionStatus
                ? ` · ${group.subscriptionStatus.replace(/_/g, " ")}`
                : ""}
              {group.accountStatus ? ` · account ${group.accountStatus}` : ""}
            </dd>
          </div>
          <div className="min-w-0 space-y-1 bg-black/25 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Login
            </dt>
            <dd className="font-medium wrap-break-word">
              {group.disabledCount > 0 ? (
                <span className="text-destructive">
                  {group.disabledCount} disabled ·{" "}
                  {group.userCount - group.disabledCount} active
                </span>
              ) : (
                <span className="text-[var(--apex-success)]">All active</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="w-full min-w-0 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 shrink-0 text-[var(--apex-teal)]" />
          Staff accounts
        </div>
        {byRole.map(([role, users]) => (
          <section
            key={role}
            className="w-full min-w-0 space-y-2 rounded-xl border border-border/50 bg-card/45 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold wrap-break-word">
                <span className="h-4 w-1 shrink-0 rounded-full bg-linear-to-b from-[var(--apex-teal)] to-[var(--apex-gold)]" />
                {role}
              </h3>
              <span className="shrink-0 rounded-md bg-white/6 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {users.length}
              </span>
            </div>
            <div className="w-full min-w-0 space-y-1.5">
              {users.map((user) => (
                <UserDetailCard key={user.id} user={user} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Button
        asChild
        variant="apex"
        className="h-11 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold"
      >
        <Link href={`/tenants/${encodeURIComponent(group.tinNumber)}`}>
          Open wholesaler page
          <ArrowRight className="h-4 w-4 opacity-80" />
        </Link>
      </Button>
    </div>
  );
}

export function ApexTenantUsersDetailTrigger({
  group,
  children,
  className,
}: {
  group: TenantUsersGroup;
  children: ReactNode;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const schedulePreviewOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 220);
  };

  const schedulePreviewClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 160);
  };

  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  return (
    <>
      <Popover
        open={previewOpen && !sheetOpen}
        onOpenChange={(next) => {
          if (!next) setPreviewOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/detail max-w-full rounded-md text-left outline-none transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40",
              "cursor-pointer",
              className,
            )}
            onMouseEnter={schedulePreviewOpen}
            onMouseLeave={schedulePreviewClose}
            onFocus={schedulePreviewOpen}
            onBlur={schedulePreviewClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSheet();
              }
            }}
            aria-label={`Details for ${group.hotelDisplayName}`}
          >
            <span className="inline-flex max-w-full items-start gap-1">
              <span className="min-w-0 flex-1">{children}</span>
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/detail:opacity-70" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="flex max-h-[min(80vh,36rem)] w-[min(100vw-2rem,28rem)] flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="h-1 w-full shrink-0 bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-card/35 p-3">
            <PreviewBody group={group} />
          </div>
          <div className="shrink-0 border-t border-border/60 bg-card/40 p-3">
            <Button
              type="button"
              variant="apex"
              className="h-11 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold"
              onClick={openSheet}
            >
              Open full detail
              <ArrowRight className="h-4 w-4 opacity-80" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100%,32rem)] data-[side=right]:max-w-[min(100%,32rem)] data-[side=right]:sm:w-lg data-[side=right]:sm:max-w-lg"
        >
          <div className="h-1 w-full shrink-0 bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 bg-card/40 px-5 py-4 pr-14 text-left">
            <SheetTitle className="text-base leading-snug wrap-break-word">
              {group.hotelDisplayName}
            </SheetTitle>
            <SheetDescription className="text-xs leading-snug wrap-break-word">
              {tenantUsersMetaLine(group)}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4">
            <SheetBody group={group} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
