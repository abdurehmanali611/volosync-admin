"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TenantPickerOption } from "@/components/apex/feedback/ApexTenantPropertyPicker";

type Props = {
  options: TenantPickerOption[];
  value: string[];
  onValueChange: (tins: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
};

export function ApexTenantMultiPropertyPicker({
  options,
  value,
  onValueChange,
  disabled,
  loading,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedCount = value.length;

  const toggle = (tin: string) => {
    const next = new Set(selectedSet);
    if (next.has(tin)) next.delete(tin);
    else next.add(tin);
    onValueChange([...next]);
  };

  const selectAllVisible = (visible: TenantPickerOption[]) => {
    const next = new Set(selectedSet);
    for (const o of visible) next.add(o.tinNumber);
    onValueChange([...next]);
  };

  const clearAll = () => onValueChange([]);

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
            : selectedCount === 0
              ? "Select wholesalers…"
              : `${selectedCount} propert${selectedCount === 1 ? "y" : "ies"} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search name or TIN…" />
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={loading || options.length === 0}
              onClick={() => selectAllVisible(options)}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={selectedCount === 0}
              onClick={clearAll}
            >
              Clear
            </Button>
          </div>
          <CommandList>
            <CommandEmpty>No wholesaler found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selectedSet.has(o.tinNumber);
                return (
                  <CommandItem
                    key={o.tinNumber}
                    value={`${o.hotelDisplayName} ${o.tinNumber}`}
                    onSelect={() => toggle(o.tinNumber)}
                    className="gap-2"
                  >
                    <Checkbox
                      checked={checked}
                      className="pointer-events-none"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {o.hotelDisplayName}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {o.tinNumber}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
