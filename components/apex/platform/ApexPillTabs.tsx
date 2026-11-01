"use client";

import { cn } from "@/lib/utils";

export type PillTab = { value: string; label: string; count?: number };

/** Stateful filter pills (the reference console uses router links; queues here are client-side). */
export function ApexPillTabs({
  value,
  onChange,
  tabs,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  tabs: PillTab[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/6 bg-white/3 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-apex-emerald/15 text-apex-emerald shadow-[inset_0_0_0_1px_var(--apex-emerald-glow)]"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] tabular-nums",
                  active ? "bg-apex-emerald/20" : "bg-white/6",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
