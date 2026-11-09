"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type TenantPickerOption = {
  tinNumber: string;
  hotelDisplayName: string;
  isBranch?: boolean;
  isMain?: boolean;
  parentTin?: string | null;
};

export type TenantOptionGroup = {
  tinNumber: string;
  hotelDisplayName: string;
  options: TenantPickerOption[];
};

/** Group a flat tenant list into company headers with Main + satellites below. */
export function groupTenantOptions(
  options: TenantPickerOption[],
): TenantOptionGroup[] {
  const byTin = new Map(options.map((option) => [option.tinNumber, option]));
  const groups = new Map<string, TenantOptionGroup>();

  for (const option of options) {
    const rootTin =
      option.isBranch && option.parentTin ? option.parentTin : option.tinNumber;
    const existing = groups.get(rootTin);
    if (existing) {
      existing.options.push(option);
      continue;
    }
    const root = byTin.get(rootTin);
    groups.set(rootTin, {
      tinNumber: rootTin,
      hotelDisplayName: root?.hotelDisplayName ?? option.hotelDisplayName,
      options: [option],
    });
  }

  const result = [...groups.values()];
  for (const group of result) {
    group.options.sort((a, b) => {
      if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
      return a.hotelDisplayName.localeCompare(b.hotelDisplayName, undefined, {
        sensitivity: "base",
      });
    });
  }
  return result.sort((a, b) =>
    a.hotelDisplayName.localeCompare(b.hotelDisplayName, undefined, {
      sensitivity: "base",
    }),
  );
}

type Props = {
  options: TenantPickerOption[];
  value: string;
  onValueChange: (tin: string) => void;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
};

export function ApexTenantPropertyPicker({
  options,
  value,
  onValueChange,
  disabled,
  loading,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.tinNumber === value),
    [options, value],
  );
  const groups = useMemo(() => groupTenantOptions(options), [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="h-11 w-full cursor-pointer justify-between font-normal shadow-sm"
        >
          {loading
            ? "Loading wholesalers…"
            : selected
              ? `${selected.hotelDisplayName} (${selected.tinNumber})`
              : "Select wholesaler…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search name or TIN…" />
          <CommandList>
            <CommandEmpty>No wholesaler found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.tinNumber} heading={group.hotelDisplayName}>
                {group.options.map((o) => (
                  <CommandItem
                    key={o.tinNumber}
                    value={`${o.hotelDisplayName} ${o.tinNumber} ${group.hotelDisplayName}`}
                    onSelect={() => {
                      onValueChange(o.tinNumber);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === o.tinNumber ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{o.hotelDisplayName}</span>
                    {o.isMain ? (
                      <span className="ml-1 shrink-0 rounded border border-[var(--apex-gold)]/40 px-1 text-[10px] uppercase text-[var(--apex-gold)]">
                        Main
                      </span>
                    ) : null}
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">
                      {o.tinNumber}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
