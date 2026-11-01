"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APEX_ACTION_NAV,
  APEX_MAIN_NAV,
  APEX_MONITORING_NAV,
  type ApexNavItem,
} from "@/constants/apexNav";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useApexDashboard } from "@/lib/admin/dashboard";

const GROUPS: { label: string; items: ApexNavItem[] }[] = [
  { label: "Workspace", items: APEX_MAIN_NAV },
  { label: "Monitoring", items: APEX_MONITORING_NAV },
  { label: "Action queues", items: APEX_ACTION_NAV },
];

export function ApexCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { summary } = useApexDashboard();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("apex:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("apex:open-command", onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Apex command palette"
      description="Jump to any page or workflow"
      className="apex-cmdk-dialog max-w-xl border-0 p-0 shadow-2xl"
    >
      <CommandInput placeholder="Search tenants, payments, modules, pricing…" />
      <CommandList className="max-h-[min(420px,60vh)]">
        <CommandEmpty>No matching destination.</CommandEmpty>
        {GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group.label}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge =
                  item.badgeKey && summary && summary[item.badgeKey] > 0
                    ? summary[item.badgeKey]
                    : null;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.href}`}
                    onSelect={() => go(item.href)}
                    className="apex-cmdk-item gap-3 rounded-lg py-2.5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[oklch(0.78_0.04_162)]" />
                    <span className="flex-1">{item.label}</span>
                    {badge != null ? (
                      <span className="rounded-full bg-[oklch(0.69_0.16_162)] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[oklch(0.14_0.015_162)]">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="flex items-center justify-between border-t border-white/8 px-3 py-2 text-[10px] text-muted-foreground">
        <span>Navigate the Apex console instantly</span>
        <CommandShortcut>⌘K</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
