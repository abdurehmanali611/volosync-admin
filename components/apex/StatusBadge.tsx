import { Badge } from "@/components/ui/badge";
import { businessTypeLabel, normalizeBusinessTypeKey } from "@/constants/businessTypes";
import { Building2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBSCRIPTION_LABELS: Record<string, string> = {
  setup_pending: "Setup pending",
  pending_approval: "Payment pending",
  active: "Active",
  warning: "Renewal soon",
  grace: "Grace period",
  expired: "Expired",
  on_hold: "Billing hold",
  trial: "Free trial",
  exempt: "Exempt",
};

const ACCOUNT_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  deleted: "Deleted",
};

const subscriptionStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-200/90 ring-1 ring-emerald-500/25",
  exempt: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/22",
  trial: "bg-[oklch(0.55_0.04_85/0.12)] text-[oklch(0.86_0.03_85)] ring-1 ring-[oklch(0.6_0.04_85/0.22)]",
  warning: "bg-[oklch(0.55_0.04_75/0.12)] text-[oklch(0.85_0.03_75)] ring-1 ring-[oklch(0.6_0.04_75/0.22)]",
  grace: "bg-[oklch(0.52_0.04_55/0.12)] text-[oklch(0.84_0.03_55)] ring-1 ring-[oklch(0.58_0.04_55/0.2)]",
  setup_pending: "bg-[oklch(0.55_0.04_85/0.12)] text-[oklch(0.86_0.03_85)] ring-1 ring-[oklch(0.62_0.04_85/0.22)]",
  pending_approval: "bg-[oklch(0.5_0.035_220/0.12)] text-[oklch(0.84_0.025_220)] ring-1 ring-[oklch(0.55_0.04_220/0.2)]",
  expired: "bg-[oklch(0.5_0.05_25/0.12)] text-[oklch(0.82_0.03_25)] ring-1 ring-[oklch(0.55_0.05_25/0.22)]",
  on_hold: "bg-[oklch(0.48_0.03_265/0.15)] text-[oklch(0.82_0.02_85)] ring-1 ring-[oklch(0.5_0.02_265/0.25)]",
};

const accountStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-200/90 ring-1 ring-emerald-500/25",
  suspended: "bg-[oklch(0.55_0.04_75/0.12)] text-[oklch(0.85_0.03_75)] ring-1 ring-[oklch(0.6_0.04_75/0.2)]",
  banned: "bg-[oklch(0.5_0.05_25/0.12)] text-[oklch(0.82_0.03_25)] ring-1 ring-[oklch(0.55_0.05_25/0.22)]",
  deleted: "bg-[oklch(0.48_0.02_265/0.18)] text-[oklch(0.78_0.02_85)] ring-1 ring-[oklch(0.5_0.02_265/0.28)]",
};

export function SubscriptionStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        subscriptionStyles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {SUBSCRIPTION_LABELS[status] ?? status}
    </Badge>
  );
}

export function AccountStatusBadge({ status }: { status: string }) {
  // The value may arrive uppercase from some endpoints — normalize before the
  // lookup so an unmatched key never renders as a blank muted pill.
  const key = String(status ?? "").trim().toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        accountStyles[key] ?? "bg-muted text-muted-foreground",
      )}
    >
      {ACCOUNT_LABELS[key] ?? status}
    </Badge>
  );
}

const BUSINESS_ICONS: Record<string, typeof Building2> = {
  Company: Building2,
  Branch: Warehouse,
};

const businessStyles: Record<string, string> = {
  Company:
    "bg-[oklch(0.55_0.04_75/0.12)] text-[oklch(0.88_0.03_75)] ring-1 ring-[oklch(0.62_0.04_75/0.22)]",
  Branch:
    "bg-[oklch(0.5_0.035_220/0.12)] text-[oklch(0.86_0.025_220)] ring-1 ring-[oklch(0.55_0.04_220/0.2)]",
};

export function BusinessTypeBadge({ businessType }: { businessType: string | null | undefined }) {
  const key = normalizeBusinessTypeKey(businessType);
  const Icon = BUSINESS_ICONS[key] ?? Building2;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent font-medium",
        businessStyles[key] ?? "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-90" />
      {businessTypeLabel(businessType)}
    </Badge>
  );
}
