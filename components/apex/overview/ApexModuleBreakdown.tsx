import Link from "next/link";
import { Puzzle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { cn } from "@/lib/utils";
import { aggregateModulesEnabled } from "@/lib/admin/dashboard";
import type { TenantListItem } from "@/lib/admin/dashboard";

const BAR_COLORS = [
  "bg-[oklch(0.69_0.06_162)]",
  "bg-[oklch(0.65_0.06_180)]",
  "bg-[oklch(0.6_0.05_300)]",
  "bg-[oklch(0.62_0.05_230)]",
  "bg-[oklch(0.65_0.05_75)]",
];

/**
 * Modules-enabled breakdown across the tenant portfolio — replaces hotcol's
 * business-type breakdown (VoloSync has no business-type concept; tenants are
 * wholesalers with INVENTORY / HR / sales-role module switches).
 */
export function ApexModuleBreakdown({ tenants }: { tenants: TenantListItem[] }) {
  const rows = aggregateModulesEnabled(tenants);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Card className="apex-panel-surface border-2">
      <CardHeader className="border-b border-white/6 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.3_0.04_162)] text-[oklch(0.88_0.04_162)] ring-1 ring-[oklch(0.55_0.05_162/0.3)]">
            <Puzzle className="h-4 w-4" />
          </span>
          Modules enabled
        </CardTitle>
        <CardDescription className="text-[13px]">
          INVENTORY, HR, and sales-role adoption across tenants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {rows.length === 0 ? (
          <ApexEmptyState
            icon={Puzzle}
            title="No tenant data yet"
            description="Tenants will appear here once they register on VoloSync."
          />
        ) : (
          rows.map((row, i) => (
            <Link
              key={row.key}
              href="/tenants"
              className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground transition-colors group-hover:text-[oklch(0.88_0.04_162)]">
                  {row.label}
                </span>
                <span className="rounded-md bg-white/6 px-2 py-0.5 font-semibold tabular-nums text-foreground ring-1 ring-white/8">
                  {row.value}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/6 ring-1 ring-white/6">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    BAR_COLORS[i % BAR_COLORS.length],
                  )}
                  style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
                />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
