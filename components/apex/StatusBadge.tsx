import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** VoloSync `subscription_state` labels + tones (yearly-only billing). */
const SUBSCRIPTION_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  DUE_SOON: "Renewal soon",
  EXPIRED: "Expired",
  UNPAID: "Never paid",
};

const SUBSCRIPTION_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-200/90 ring-1 ring-emerald-500/25",
  DUE_SOON: "bg-[oklch(0.72_0.12_75/0.12)] text-[oklch(0.9_0.05_75)] ring-1 ring-[oklch(0.72_0.12_75/0.25)]",
  EXPIRED: "bg-[oklch(0.62_0.16_25/0.12)] text-[oklch(0.9_0.04_25)] ring-1 ring-[oklch(0.62_0.16_25/0.22)]",
  UNPAID: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/22",
};

/** Queue decision badges — PENDING / APPROVED / REJECTED. */
const DECISION_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const DECISION_STYLES: Record<string, string> = {
  PENDING: "bg-[oklch(0.72_0.12_75/0.12)] text-[oklch(0.9_0.05_75)] ring-1 ring-[oklch(0.72_0.12_75/0.25)]",
  APPROVED: "bg-emerald-500/15 text-emerald-200/90 ring-1 ring-emerald-500/25",
  REJECTED: "bg-[oklch(0.62_0.16_25/0.12)] text-[oklch(0.9_0.04_25)] ring-1 ring-[oklch(0.62_0.16_25/0.22)]",
};

/** Feedback status badges — OPEN / READ / RESOLVED. */
const FEEDBACK_LABELS: Record<string, string> = {
  OPEN: "Open",
  READ: "Read",
  RESOLVED: "Resolved",
};

const FEEDBACK_STYLES: Record<string, string> = {
  OPEN: "bg-sky-500/15 text-sky-200/90 ring-1 ring-sky-500/25",
  READ: "bg-violet-500/15 text-violet-200/90 ring-1 ring-violet-500/25",
  RESOLVED: "bg-emerald-500/15 text-emerald-200/90 ring-1 ring-emerald-500/25",
};

function ToneBadge({
  status,
  labels,
  styles,
}: {
  status: string;
  labels: Record<string, string>;
  styles: Record<string, string>;
}) {
  const key = String(status || "").toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        styles[key] ?? "bg-muted text-muted-foreground",
      )}
    >
      {labels[key] ?? status}
    </Badge>
  );
}

export function SubscriptionStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge status={status} labels={SUBSCRIPTION_LABELS} styles={SUBSCRIPTION_STYLES} />
  );
}

export function DecisionStatusBadge({ status }: { status: string }) {
  return <ToneBadge status={status} labels={DECISION_LABELS} styles={DECISION_STYLES} />;
}

export function FeedbackStatusBadge({ status }: { status: string }) {
  return <ToneBadge status={status} labels={FEEDBACK_LABELS} styles={FEEDBACK_STYLES} />;
}
