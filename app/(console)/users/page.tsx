"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
import {
  fetchTenantUsers,
  fetchTenants,
  type TenantListItem,
  type TenantUserMonitoringRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/components/apex/layout/ApexSearchInput";
import {
  ApexTenantUsersDetailTrigger,
  tenantStandingLabel,
  tenantUsersMetaLine,
  type TenantUsersGroup,
} from "@/components/apex/tenant/ApexTenantUsersDetailTrigger";
import { Badge } from "@/components/ui/badge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";
import { cn } from "@/lib/utils";

type CompanyUsersGroup = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string;
  standingLabel: string;
  userCount: number;
  disabledCount: number;
  members: TenantUsersGroup[];
};

function groupUsersByTenant(
  users: TenantUserMonitoringRow[],
  tenantsByTin: Map<string, TenantListItem>,
): TenantUsersGroup[] {
  const byTin = new Map<string, TenantUserMonitoringRow[]>();
  for (const user of users) {
    const tin = String(user.tinNumber).trim();
    if (!tin) continue;
    const list = byTin.get(tin);
    if (list) list.push(user);
    else byTin.set(tin, [user]);
  }

  const groups: TenantUsersGroup[] = [];
  for (const [tinNumber, groupUsers] of byTin) {
    const tenant = tenantsByTin.get(tinNumber);
    const roles = [
      ...new Set(
        groupUsers.map((u) => String(u.role || "").trim()).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const standingLabel = tenantStandingLabel({
      accountStatus: tenant?.accountStatus,
      subscriptionStatus: tenant?.subscriptionStatus,
      isIllustrationTenant: tenant?.isIllustrationTenant,
    });
    groups.push({
      tinNumber,
      hotelDisplayName:
        tenant?.hotelDisplayName ||
        groupUsers[0]?.hotelDisplayName ||
        tinNumber,
      businessType: tenant?.businessType || groupUsers[0]?.businessType || "",
      roleCount: roles.length,
      roles,
      userCount: groupUsers.length,
      disabledCount: groupUsers.filter((u) => u.loginDisabled).length,
      pays: standingLabel === "Pays",
      standingLabel,
      subscriptionStatus: tenant?.subscriptionStatus ?? null,
      accountStatus: tenant?.accountStatus ?? null,
      isIllustrationTenant: Boolean(tenant?.isIllustrationTenant),
      users: groupUsers,
    });
  }

  return groups;
}

function emptyGroup(
  tenant: TenantListItem,
  users: TenantUserMonitoringRow[],
): TenantUsersGroup {
  const standingLabel = tenantStandingLabel({
    accountStatus: tenant.accountStatus,
    subscriptionStatus: tenant.subscriptionStatus,
    isIllustrationTenant: tenant.isIllustrationTenant,
  });
  const roles = [...new Set(users.map((user) => user.role).filter(Boolean))];
  return {
    tinNumber: tenant.tinNumber,
    hotelDisplayName: tenant.hotelDisplayName,
    businessType: tenant.businessType || "",
    roleCount: roles.length,
    roles,
    userCount: users.length,
    disabledCount: users.filter((user) => user.loginDisabled).length,
    pays: standingLabel === "Pays",
    standingLabel,
    subscriptionStatus: tenant.subscriptionStatus,
    accountStatus: tenant.accountStatus,
    isIllustrationTenant: tenant.isIllustrationTenant,
    users,
  };
}

function buildCompanyGroups(
  groups: TenantUsersGroup[],
  tenantsByTin: Map<string, TenantListItem>,
): CompanyUsersGroup[] {
  const byRoot = new Map<string, TenantUsersGroup[]>();
  for (const group of groups) {
    const tenant = tenantsByTin.get(group.tinNumber);
    const rootTin =
      tenant?.isBranch && tenant.parentTin ? tenant.parentTin : group.tinNumber;
    const list = byRoot.get(rootTin);
    if (list) list.push(group);
    else byRoot.set(rootTin, [group]);
  }

  const companies: CompanyUsersGroup[] = [];
  for (const [rootTin, memberGroups] of byRoot) {
    const rootTenant = tenantsByTin.get(rootTin);
    if (!rootTenant) {
      // No company row (deleted/renamed) — keep the user groups visible.
      const name = memberGroups[0]?.hotelDisplayName ?? rootTin;
      companies.push({
        tinNumber: rootTin,
        hotelDisplayName: name,
        businessType: memberGroups[0]?.businessType ?? "",
        standingLabel: memberGroups[0]?.standingLabel ?? "Doesn't pay",
        userCount: memberGroups.reduce((sum, group) => sum + group.userCount, 0),
        disabledCount: memberGroups.reduce(
          (sum, group) => sum + group.disabledCount,
          0,
        ),
        members: memberGroups,
      });
      continue;
    }

    const byTin = new Map(memberGroups.map((group) => [group.tinNumber, group]));
    if (!byTin.has(rootTin)) {
      byTin.set(rootTin, emptyGroup(rootTenant, []));
    }
    const family = [
      rootTenant,
      ...Array.from(tenantsByTin.values()).filter(
        (tenant) => tenant.isBranch && tenant.parentTin === rootTin,
      ),
    ];
    for (const member of family) {
      if (!byTin.has(member.tinNumber)) {
        byTin.set(member.tinNumber, emptyGroup(member, []));
      }
    }

    const members = Array.from(byTin.values()).sort((a, b) => {
      const tenantA = tenantsByTin.get(a.tinNumber);
      const tenantB = tenantsByTin.get(b.tinNumber);
      if (tenantA?.isMain !== tenantB?.isMain) return tenantA?.isMain ? -1 : 1;
      return a.hotelDisplayName.localeCompare(b.hotelDisplayName, undefined, {
        sensitivity: "base",
      });
    });

    const standingLabel = tenantStandingLabel({
      accountStatus: rootTenant.accountStatus,
      subscriptionStatus: rootTenant.subscriptionStatus,
      isIllustrationTenant: rootTenant.isIllustrationTenant,
    });
    companies.push({
      tinNumber: rootTin,
      hotelDisplayName: rootTenant.hotelDisplayName,
      businessType: rootTenant.businessType || "",
      standingLabel,
      userCount: members.reduce((sum, group) => sum + group.userCount, 0),
      disabledCount: members.reduce((sum, group) => sum + group.disabledCount, 0),
      members,
    });
  }

  return companies.sort((a, b) =>
    a.hotelDisplayName.localeCompare(b.hotelDisplayName, undefined, {
      sensitivity: "base",
    }),
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading users…" />}>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type") || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [companies, setCompanies] = useState<CompanyUsersGroup[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const [list, tenants] = await Promise.all([
          fetchTenantUsers(
            debouncedSearch || undefined,
            typeFilter !== "all" ? typeFilter : undefined,
            { limit: 500 },
          ),
          fetchTenants(
            undefined,
            typeFilter !== "all" ? typeFilter : undefined,
          ),
        ]);
        const tenantsByTin = new Map(
          tenants.map((t) => [String(t.tinNumber).trim(), t] as const),
        );
        const groups = groupUsersByTenant(list, tenantsByTin);
        const next = buildCompanyGroups(groups, tenantsByTin);
        if (!isStale()) setCompanies(next);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load users");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [debouncedSearch, typeFilter, coordinator]);

  const toggle = (tin: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tin)) next.delete(tin);
      else next.add(tin);
      return next;
    });
  };

  const totalUsers = useMemo(
    () => companies.reduce((sum, company) => sum + company.userCount, 0),
    [companies],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Tenant users"
        description="Companies collapsed by default — expand one to see its Main and branch users"
      />

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search username, wholesaler, TIN…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={4} />
        ) : companies.length === 0 ? (
          <ApexEmptyState
            icon={Users}
            title="No users found"
            description={
              debouncedSearch
                ? "Try a different search term."
                : "No accounts match this filter."
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Login</th>
                <th className="px-4 py-3 font-medium">TIN</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const open = expanded.has(company.tinNumber);
                return (
                  <CompanyRows
                    key={company.tinNumber}
                    company={company}
                    open={open}
                    onToggle={() => toggle(company.tinNumber)}
                  />
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/50 text-xs text-muted-foreground">
                <td className="px-4 py-3">
                  {companies.length} compan{companies.length === 1 ? "y" : "ies"}
                </td>
                <td className="px-4 py-3 tabular-nums">{totalUsers}</td>
                <td className="px-4 py-3" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </ApexPanel>
    </div>
  );
}

function CompanyRows({
  company,
  open,
  onToggle,
}: {
  company: CompanyUsersGroup;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/30 transition-colors hover:bg-white/3"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{company.hotelDisplayName}</p>
              <p className="text-[11px] text-muted-foreground">
                {company.businessType || "Business"} · {company.members.length}{" "}
                location{company.members.length === 1 ? "" : "s"} ·{" "}
                {company.standingLabel}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 tabular-nums text-sm text-muted-foreground">
          {company.userCount}
        </td>
        <td className="px-4 py-3">
          {company.disabledCount > 0 ? (
            <Badge variant="destructive">{company.disabledCount} disabled</Badge>
          ) : (
            <Badge variant="success">All active</Badge>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            {company.tinNumber}
          </span>
        </td>
      </tr>
      {open
        ? company.members.map((member) => {
            const isRoot = member.tinNumber === company.tinNumber;
            return (
              <tr
                key={`${company.tinNumber}-${member.tinNumber}`}
                className="border-b border-border/20 bg-black/15 last:border-0"
              >
                <td className="px-4 py-2.5 pl-10">
                  <ApexTenantUsersDetailTrigger
                    group={member}
                    className="-mx-1 px-1 py-0.5"
                  >
                    <div className="flex max-w-xs flex-col gap-0.5">
                      <span className="flex items-center gap-2 font-medium wrap-break-word underline-offset-2 group-hover/detail:underline">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {isRoot ? "Main" : "Branch"}
                        </span>
                        {member.hotelDisplayName}
                      </span>
                      <span className="text-[10px] leading-snug text-muted-foreground wrap-break-word">
                        {tenantUsersMetaLine(member)}
                      </span>
                    </div>
                  </ApexTenantUsersDetailTrigger>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-sm text-muted-foreground">
                  {member.userCount}
                </td>
                <td className="px-4 py-2.5">
                  {member.disabledCount > 0 ? (
                    <Badge variant="destructive">
                      {member.disabledCount} disabled
                    </Badge>
                  ) : (
                    <Badge variant="success">All active</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    {member.tinNumber}
                  </span>
                </td>
              </tr>
            );
          })
        : null}
    </>
  );
}
