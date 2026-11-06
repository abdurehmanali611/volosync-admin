"use client";

import {
  Building2,
  CreditCard,
  MessageCircle,
  Tags,
  UserPlus,
  Users,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    id: "setup-payments",
    href: "/payments/setup",
    label: "Setup payments",
    icon: UserPlus,
    countKey: "pendingSetupPayments" as const,
    tone: "gold",
  },
  {
    id: "yearly-payments",
    href: "/payments/yearly",
    label: "Yearly",
    icon: CreditCard,
    countKey: "pendingYearlyPayments" as const,
    tone: "teal",
  },
  {
    id: "yearly-payments",
    href: "/payments/yearly",
    label: "Yearly",
    icon: CreditCard,
    countKey: "pendingYearlyPayments" as const,
    tone: "violet",
  },
  {
    id: "feedback",
    href: "/feedback",
    label: "Wholesaler chat",
    icon: MessageCircle,
    countKey: "unreadFeedback" as const,
    tone: "teal",
  },
  {
    id: "signups",
    href: "/signups",
    label: "New signups",
    icon: UserPlus,
    countKey: "setupPendingTenants" as const,
    tone: "gold",
  },
  {
    id: "reports",
    href: "/reports",
    label: "Analytics",
    icon: BarChart3,
    tone: "teal",
  },
  {
    id: "tenants",
    href: "/tenants",
    label: "All tenants",
    icon: Building2,
    tone: "neutral",
  },
  {
    id: "users",
    href: "/users",
    label: "Tenant users",
    icon: Users,
    countKey: "disabledUsers" as const,
    tone: "neutral",
  },
  {
    id: "pricing",
    href: "/pricing",
    label: "Pricing catalog",
    icon: Tags,
    tone: "neutral",
  },
] as const;

const TONE_CLASS: Record<string, string> = {
  gold: "apex-quick-pill-gold",
  teal: "apex-quick-pill-teal",
  violet: "apex-quick-pill-violet",
  neutral: "apex-quick-pill-neutral",
};

export function ApexDashboardQuickActions({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="apex-quick-actions-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        const count =
          "countKey" in action && action.countKey
            ? summary[action.countKey]
            : 0;
        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              "apex-quick-pill group shrink-0",
              TONE_CLASS[action.tone],
              count > 0 && "apex-quick-pill-attention",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80 transition-transform group-hover:scale-110" />
            <span>{action.label}</span>
            {count > 0 ? (
              <span className="rounded-full bg-linear-to-r from-primary to-[oklch(0.72_0.08_85)] px-1.5 py-px text-[10px] font-bold tabular-nums text-[oklch(0.12_0.02_265)]">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
