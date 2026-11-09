"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  GitBranch,
  Layers3,
  Receipt,
  Settings2,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TenantTabId =
  | "reports"
  | "payments"
  | "access"
  | "billing"
  | "modules"
  | "excel"
  | "staff"
  | "branches"
  | "owner";

export type TenantSection = {
  id: TenantTabId;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const TENANT_TABS: TenantSection[] = [
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    description: "Health, charts, and wholesaler analytics",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    description: "Approvals and payment history",
  },
  {
    id: "access",
    label: "Access",
    icon: Shield,
    description: "Suspend, ban, and account control",
  },
  {
    id: "billing",
    label: "Billing",
    icon: Settings2,
    description: "Fees, trial, and billing notes",
  },
  {
    id: "modules",
    label: "Modules",
    icon: Layers3,
    description: "Enabled product modules",
  },
  {
    id: "excel",
    label: "Excel import",
    icon: FileSpreadsheet,
    description: "Sample templates and bulk seed import",
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    description: "Staff accounts and login control",
  },
  {
    id: "branches",
    label: "Branches",
    icon: GitBranch,
    description: "Additional locations under this wholesaler",
  },
  {
    id: "owner",
    label: "Owner",
    icon: UserCircle2,
    description: "Portfolio owner linkage",
  },
];

export function ApexTenantSectionNav({
  value,
  onValueChange,
  className,
  tabs = TENANT_TABS,
}: {
  value: TenantTabId;
  onValueChange: (id: TenantTabId) => void;
  className?: string;
  tabs?: TenantSection[];
}) {
  const active = tabs.find((t) => t.id === value) ?? tabs[0];

  return (
    <div className={cn("space-y-3", className)}>
      <nav
        aria-label="Tenant sections"
        className="apex-tenant-nav sticky top-15 z-5 -mx-1 overflow-x-auto px-1"
      >
        <div className="apex-tenant-tab-track inline-flex min-w-full gap-1 p-1.5 sm:min-w-0">
          {tabs.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === value;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onValueChange(section.id)}
                aria-pressed={isActive}
                className={cn(
                  "apex-tenant-nav-link group relative shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "apex-tenant-nav-link-active text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[oklch(0.82_0.06_85)]"
                      : "text-muted-foreground group-hover:text-foreground/80",
                  )}
                />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="flex items-center gap-2 px-1">
        <Receipt className="h-3.5 w-3.5 text-[oklch(0.72_0.06_85)]" />
        <p className="text-xs text-muted-foreground">{active.description}</p>
      </div>
    </div>
  );
}
