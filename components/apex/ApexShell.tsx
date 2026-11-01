"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut, Search } from "lucide-react";
import { ApexLogo, ApexLogoMark } from "@/components/apex/ApexLogo";
import { ApexLiveClock } from "@/components/apex/ApexLiveClock";

const ApexCommandPalette = dynamic(
  () =>
    import("@/components/apex/ApexCommandPalette").then((m) => m.ApexCommandPalette),
  { ssr: false },
);
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { RefreshIconButton } from "@/components/ui/refresh-icon-button";
import {
  APEX_ACTION_NAV,
  APEX_MAIN_NAV,
  APEX_MONITORING_NAV,
  type ApexNavItem,
} from "@/constants/apexNav";
import { clearApexSession, getApexMember } from "@/lib/admin/session";
import {
  useApexDashboard,
  type DashboardSummary,
} from "@/lib/admin/dashboard";
import { useApexRouteGuard } from "@/hooks/useApexRouteGuard";
import { broadcastSystemRefresh } from "@/hooks/useSystemRefresh";
import { apexPageTitle } from "@/lib/admin/pageTitles";
import { cn } from "@/lib/utils";
import { ApexHeaderHealthPill } from "@/components/apex/tenant/ApexTenantListSummary";

function isNavActive(item: ApexNavItem, pathname: string, searchParams: URLSearchParams) {
  const [path, queryString] = item.href.split("?");
  const pathMatch =
    pathname === path || (item.matchPrefix && pathname.startsWith(`${path}/`));
  if (!pathMatch && pathname !== path) return false;
  if (queryString) {
    const expected = new URLSearchParams(queryString);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return pathname === path;
  }
  if (pathname === path && searchParams.toString() && item.href !== "/") {
    return false;
  }
  return pathname === path || (item.matchPrefix && pathname.startsWith(`${path}/`));
}

function badgeForItem(item: ApexNavItem, summary: DashboardSummary | null) {
  if (!item.badgeKey || !summary) return undefined;
  const n = summary[item.badgeKey];
  return n > 0 ? n : undefined;
}

function ApexNavGroup({
  label,
  items,
  pathname,
  searchParams,
  summary,
}: {
  label: string;
  items: ApexNavItem[];
  pathname: string;
  searchParams: URLSearchParams;
  summary: DashboardSummary | null;
}) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="px-1">
      <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item, pathname, searchParams);
          const badge = badgeForItem(item, summary);
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                type="button"
                isActive={active}
                tooltip={item.label}
                className={cn(
                  "h-10 cursor-pointer rounded-lg transition-colors",
                  active && "apex-nav-active font-medium",
                )}
                onClick={() => {
                  router.push(item.href);
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Icon className={cn("h-4 w-4", active && "text-foreground")} />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {badge != null ? (
                <SidebarMenuBadge className="apex-nav-badge">
                  {badge > 99 ? "99+" : badge}
                </SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function ApexShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ready = useApexRouteGuard();
  const { summary, loading, error, refresh } = useApexDashboard();
  const [refreshing, setRefreshing] = useState(false);
  const member = getApexMember();

  const displayName = member?.name || member?.username || "Apex admin";
  const pageTitle = apexPageTitle(pathname, searchParams);
  const queueTotal = summary
    ? summary.pendingSetupPayments +
      summary.pendingYearlyPayments +
      summary.pendingModuleRequests +
      summary.unreadFeedback
    : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // The page's own data reloads through the same system signal.
      broadcastSystemRefresh();
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  };

  if (!ready) {
    return (
      <div className="apex-canvas apex-loading-screen flex min-h-svh flex-col items-center justify-center gap-6">
        <div className="relative">
          <ApexLogo size={56} priority className="apex-loading-pulse relative opacity-90" />
          <Loader2
            className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-primary"
            aria-hidden
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Preparing your workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="min-h-svh bg-muted/40">
      <ApexCommandPalette />
      <div className="flex min-h-svh w-full">
        <Sidebar collapsible="icon" className="apex-sidebar border-r-0">
          <SidebarHeader className="apex-sidebar-header border-b border-sidebar-border px-3 py-4">
            <div className="flex items-center gap-3">
              <ApexLogo size={40} className="shrink-0 opacity-95" />
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  VoloSync · Apex
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Operations & monitoring
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-3">
            <ApexNavGroup
              label="Workspace"
              items={APEX_MAIN_NAV}
              pathname={pathname}
              searchParams={searchParams}
              summary={summary}
            />
            <SidebarSeparator className="my-3 bg-sidebar-border" />
            <ApexNavGroup
              label="Monitoring"
              items={APEX_MONITORING_NAV}
              pathname={pathname}
              searchParams={searchParams}
              summary={summary}
            />
            <SidebarSeparator className="my-3 bg-sidebar-border" />
            <ApexNavGroup
              label="Action queues"
              items={APEX_ACTION_NAV}
              pathname={pathname}
              searchParams={searchParams}
              summary={summary}
            />

            {summary && (summary.expired > 0 || summary.dueSoon > 0) ? (
              <div className="apex-alert-card mx-2 mt-4 group-data-[collapsible=icon]:hidden">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Renewal alerts
                </p>
                {summary.dueSoon > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {summary.dueSoon} subscription{summary.dueSoon === 1 ? "" : "s"} due
                    within 30 days
                  </p>
                ) : null}
                {summary.expired > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {summary.expired} subscription{summary.expired === 1 ? "" : "s"} expired
                  </p>
                ) : null}
              </div>
            ) : null}
          </SidebarContent>

          <SidebarFooter className="apex-sidebar-footer border-t border-sidebar-border p-3">
            <div className="apex-user-card mb-2 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-3">
                <ApexLogoMark size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">Apex team</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 border-destructive/25 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/15 hover:text-destructive"
              onClick={() => {
                clearApexSession();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="apex-canvas apex-floating-inset flex min-h-svh flex-col overflow-x-hidden">
          <header className="apex-topbar sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 px-4 md:h-16 md:px-6">
            <SidebarTrigger className="apex-icon-btn h-9 w-9 shrink-0" />
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {pageTitle}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {loading && !summary
                  ? "Syncing queue counts…"
                  : queueTotal > 0
                    ? `${queueTotal} item${queueTotal === 1 ? "" : "s"} in your queues`
                    : `Signed in as ${displayName}`}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("apex:open-command"))}
                className="apex-icon-btn hidden h-9 items-center gap-2 px-3 text-xs text-muted-foreground sm:flex"
                aria-label="Open command palette"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Search</span>
                <kbd className="rounded border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘K
                </kbd>
              </button>
              {loading && !summary ? (
                <span className="hidden h-7 w-16 animate-pulse rounded-full bg-muted sm:inline" />
              ) : summary ? (
                <ApexHeaderHealthPill summary={summary} />
              ) : null}
              {queueTotal > 0 ? (
                <span className="hidden rounded-full border border-primary/35 bg-primary/12 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-primary sm:inline">
                  {queueTotal} pending
                </span>
              ) : null}
              <ApexLiveClock />
              <RefreshIconButton
                busy={refreshing}
                disabled={loading}
                onClick={() => void onRefresh()}
                aria-label="Refresh page and dashboard counts"
                className="apex-icon-btn"
              />
              <ApexLogoMark size={36} className="md:hidden" />
            </div>
          </header>

          {error ? (
            <div className="mx-4 mt-3 md:mx-6">
              <div className="apex-error-alert">{error}</div>
            </div>
          ) : null}

          <main className="min-h-0 flex-1 overflow-x-hidden px-3 pb-8 pt-2 md:px-5 md:pb-10 lg:px-6">
            <div className="apex-inset-frame apex-page mx-auto w-full min-w-0 max-w-7xl p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
