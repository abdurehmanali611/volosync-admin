import {
  Activity,
  AlertTriangle,
  Building2,
  GitBranch,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantListItem } from "@/lib/admin/dashboard";

/** hotcol-style summary chip strip for the tenants list. */
export function ApexTenantSummary({
  tenants,
  total,
}: {
  tenants: TenantListItem[];
  total: number;
}) {
  const active = tenants.filter(
    (t) => t.subscription_state === "ACTIVE",
  ).length;
  const atRisk = tenants.filter(
    (t) =>
      t.subscription_state === "DUE_SOON" || t.subscription_state === "EXPIRED",
  ).length;
  const mains = tenants.filter((t) => !t.is_branch).length;
  const branches = tenants.filter((t) => t.is_branch).length;
  const staff = tenants.reduce((sum, t) => sum + t.staff_count, 0);

  const chips = [
    {
      label: "active",
      value: active,
      icon: Activity,
      tone: "text-apex-emerald",
    },
    {
      label: "need renewal",
      value: atRisk,
      icon: AlertTriangle,
      tone: "text-apex-amber",
    },
    {
      label: "companies",
      value: mains,
      icon: Building2,
      tone: "text-apex-teal",
    },
    {
      label: "branches",
      value: branches,
      icon: GitBranch,
      tone: "text-apex-sky",
    },
    { label: "staff", value: staff, icon: Users, tone: "text-apex-violet" },
  ].filter((chip) => chip.value > 0);

  if (chips.length === 0) return null;

  return (
    <div className="apex-tenant-summary flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-white/3 p-3">
      <p className="mr-2 text-xs font-medium text-muted-foreground">
        Showing {tenants.length} of {total}
      </p>
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/8",
              chip.tone,
            )}
          >
            <Icon className="size-3 opacity-80" />
            {chip.value} {chip.label}
          </span>
        );
      })}
    </div>
  );
}
