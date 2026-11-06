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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ApexComboboxOption = {
  value: string;
  label: string;
  hint?: string;
};

/** Searchable single-select used for list filters. */
export function ApexFilterCombobox({
  value,
  onChange,
  options,
  label,
  placeholder = "Search…",
  emptyText = "No matches.",
  className,
  contentClassName,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ApexComboboxOption[];
  label: string;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""} ${option.value}`
        .toLowerCase()
        .includes(query),
    );
  }, [options, query]);

  const selected = options.find((option) => option.value === value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className={cn(
            "h-10 w-full min-w-44 justify-between rounded-xl border-white/10 bg-white/4 font-normal",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate text-left",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-(--radix-popover-trigger-width) p-0", contentClassName)}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((option) => {
                  const active = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="gap-2 data-selected:bg-transparent hover:bg-muted active:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          active ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
