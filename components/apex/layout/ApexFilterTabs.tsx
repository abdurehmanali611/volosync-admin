import Link from "next/link";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ApexFilterTab = {
  value: string;
  label: string;
  href: string;
};

export function ApexFilterTabs({
  value,
  tabs,
  className,
  wrap,
}: {
  value: string;
  tabs: ApexFilterTab[];
  className?: string;
  wrap?: boolean;
}) {
  return (
    <Tabs value={value} className={cn("w-full", className)}>
      <TabsList
        className={cn(
          "apex-tabs-list",
          wrap && "h-auto flex-wrap justify-start",
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild className="apex-tabs-trigger">
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function ApexSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="apex-section-header flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ApexResultCount({
  shown,
  total,
  noun = "results",
}: {
  shown: number;
  total: number;
  noun?: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      Showing{" "}
      <span className="font-semibold tabular-nums text-foreground">{shown}</span> of{" "}
      <span className="font-semibold tabular-nums text-foreground">{total}</span> {noun}
    </p>
  );
}
