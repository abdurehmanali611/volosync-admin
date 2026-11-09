"use client";

import Link from "next/link";
import { Building2, GitBranch } from "lucide-react";
import type { TenantFamilyMember } from "@/lib/apex/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Horizontal Main + satellite switch shown above the tenant detail tabs.
 * Main carries a gold treatment so the company root stays obvious; every
 * branch is a normal tenant detail page underneath.
 */
export function ApexTenantFamilyTabs({
  family,
  currentTin,
}: {
  family: TenantFamilyMember[];
  currentTin: string;
}) {
  if (!family || family.length <= 1) return null;

  return (
    <nav
      aria-label="Company branches"
      className="apex-tenant-nav -mx-1 overflow-x-auto px-1"
    >
      <div className="inline-flex min-w-full gap-1.5 rounded-2xl border border-border/50 bg-black/20 p-1.5 sm:min-w-0">
        {family.map((member) => {
          const active = member.tinNumber.toLowerCase() === currentTin.toLowerCase();
          const Icon = member.isMain ? Building2 : GitBranch;
          return (
            <Link
              key={member.id}
              href={`/tenants/${encodeURIComponent(member.tinNumber)}`}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-all duration-200",
                member.isMain
                  ? "border border-[oklch(0.82_0.06_85)]/35 bg-[oklch(0.82_0.06_85)]/8 text-[oklch(0.88_0.05_85)]"
                  : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
                active && "ring-1 ring-[oklch(0.82_0.06_85)]/60",
                active && !member.isMain && "bg-white/6 text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="max-w-44 truncate">{member.name}</span>
              {member.isMain ? (
                <Badge variant="outline" className="border-[oklch(0.82_0.06_85)]/40 text-[10px]">
                  Main
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
