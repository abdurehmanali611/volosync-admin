"use client";

import { ApexFilterCombobox } from "@/components/apex/layout/ApexFilterCombobox";

export type SalesAgentOption = {
  id: number;
  displayName: string;
  phone?: string | null;
  city?: string | null;
};

const NONE = "none";

export function SalesAgentSelector({
  value,
  onChange,
  agents,
  loading,
  disabled,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  agents: SalesAgentOption[];
  loading?: boolean;
  disabled?: boolean;
}) {
  const options = [
    { value: NONE, label: "No sales agent (walk-in)" },
    ...agents.map((agent) => ({
      value: String(agent.id),
      label: agent.displayName,
      hint: [agent.city, agent.phone].filter(Boolean).join(" · "),
    })),
  ];

  return (
    <ApexFilterCombobox
      label="Sales agent"
      placeholder={loading ? "Loading sales agents…" : "No sales agent"}
      emptyText="No matching agent."
      disabled={disabled || Boolean(loading)}
      value={value != null ? String(value) : NONE}
      options={options}
      onChange={(next) => onChange(next === NONE ? null : Number(next))}
      className="h-11 min-w-0"
    />
  );
}

export function salesAgentLabel(name: string | null | undefined) {
  const t = String(name ?? "").trim();
  return t || "—";
}
