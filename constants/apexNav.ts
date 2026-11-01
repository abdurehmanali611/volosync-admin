import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Puzzle,
  Tags,
  UserPlus,
  Users,
} from "lucide-react";

/** Badge keys derivable from the polled dashboard payload (see lib/admin/dashboard.tsx). */
export type ApexNavBadgeKey =
  | "pendingSetupPayments"
  | "pendingYearlyPayments"
  | "pendingModuleRequests"
  | "unreadFeedback"
  | "inactiveTenants";

export type ApexNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
  badgeKey?: ApexNavBadgeKey;
};

export const APEX_MAIN_NAV: ApexNavItem[] = [
  { id: "overview", href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    id: "reports",
    href: "/reports",
    label: "Analytics",
    icon: BarChart3,
    matchPrefix: true,
  },
  {
    id: "tenants",
    href: "/tenants",
    label: "All tenants",
    icon: Building2,
    matchPrefix: true,
  },
  { id: "users", href: "/users", label: "Tenant users", icon: Users },
];

export const APEX_MONITORING_NAV: ApexNavItem[] = [
  {
    id: "pricing",
    href: "/pricing",
    label: "Pricing catalog",
    icon: Tags,
  },
  {
    id: "sales-agents",
    href: "/sales-agents",
    label: "Sales Agents",
    icon: Handshake,
  },
  {
    id: "modules",
    href: "/modules",
    label: "Module requests",
    icon: Puzzle,
    matchPrefix: true,
    badgeKey: "pendingModuleRequests",
  },
  {
    id: "audit",
    href: "/audit",
    label: "Audit log",
    icon: FileText,
    matchPrefix: true,
  },
];

export const APEX_ACTION_NAV: ApexNavItem[] = [
  {
    id: "setup-payments",
    href: "/payments/setup",
    label: "Setup payments",
    icon: UserPlus,
    badgeKey: "pendingSetupPayments",
  },
  {
    id: "yearly-payments",
    href: "/payments/yearly",
    label: "Yearly payments",
    icon: CreditCard,
    badgeKey: "pendingYearlyPayments",
  },
  {
    id: "signups",
    href: "/signups",
    label: "New signups",
    icon: UserPlus,
  },
  {
    id: "inactive-tenants",
    href: "/tenants?filter=inactive",
    label: "Inactive Tenants",
    icon: Users,
    badgeKey: "inactiveTenants",
  },
  {
    id: "feedback",
    href: "/feedback",
    label: "Feedback",
    icon: MessageCircle,
    matchPrefix: true,
    badgeKey: "unreadFeedback",
  },
];
