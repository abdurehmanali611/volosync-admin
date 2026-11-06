"use client";

import { useEffect, useState } from "react";
import { formatETB } from "@/lib/apex/analytics";
import Link from "next/link";
import { fetchFeedbackTenantContext, type TenantDetail } from "@/lib/apex/actions";
import {
  AccountStatusBadge,
  SubscriptionStatusBadge,
} from "@/components/apex/StatusBadge";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { Skeleton } from "@/components/ui/skeleton";

export function ApexFeedbackTenantContext({ tinNumber }: { tinNumber: string }) {
  const [ctx, setCtx] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchFeedbackTenantContext(tinNumber)
      .then(setCtx)
      .finally(() => setLoading(false));
  }, [tinNumber]);

  if (loading) {
    return (
      <ApexPanel className="space-y-2 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </ApexPanel>
    );
  }

  if (!ctx) return null;

  return (
    <ApexPanel className="p-4 text-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Support context
      </p>
      <div className="flex flex-wrap gap-2">
        <AccountStatusBadge status={ctx.accountStatus} />
        <SubscriptionStatusBadge status={ctx.subscriptionStatus} />
      </div>
      <ul className="mt-3 space-y-1 text-muted-foreground">
        <li>
          Setup: {ctx.setupFeeApproved ? "approved" : "pending"} ·{" "}
          {formatETB(ctx.setupFeeETB)}
        </li>
        <li>
          Paid until:{" "}
          {ctx.subscriptionPaidUntil
            ? new Date(ctx.subscriptionPaidUntil).toLocaleDateString()
            : "—"}
        </li>
        {ctx.paymentTransactionRef ? (
          <li className="font-mono text-xs">Ref: {ctx.paymentTransactionRef}</li>
        ) : null}
      </ul>
      <Link
        href={`/tenants/${encodeURIComponent(tinNumber)}`}
        className="mt-3 inline-block text-xs font-medium text-[oklch(0.78_0.04_85)] hover:underline"
      >
        Open tenant profile →
      </Link>
    </ApexPanel>
  );
}
