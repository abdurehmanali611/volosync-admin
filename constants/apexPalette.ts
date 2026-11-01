/**
 * Apex console color system — stat accents, button helpers, chart palette.
 * Recolored for VoloSync: emerald primary (hue 162) with teal/sky/violet/rose
 * support tones. Structural class names (.apex-stat-*) are unchanged from the
 * hotcol reference; only values were re-paletted.
 */

export type ApexStatKey =
  | "companies"
  | "branches"
  | "active"
  | "dueSoon"
  | "expired"
  | "yearRevenue"
  | "payments"
  | "stockValue"
  | "staff"
  | "pendingSetupPayments"
  | "pendingYearlyPayments"
  | "pendingModuleRequests"
  | "unreadFeedback";

export const APEX_STAT_STYLES: Record<
  ApexStatKey,
  { accent: string; icon: string; card: string; value: string; topBar: string }
> = {
  companies: {
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    icon: "bg-[oklch(0.32_0.06_162)] text-[oklch(0.92_0.04_162)] ring-1 ring-[oklch(0.69_0.16_162/0.4)] shadow-[0_0_16px_-4px_oklch(0.69_0.16_162/0.35)]",
    card: "border-[oklch(0.69_0.16_162/0.22)]",
    value: "text-[oklch(0.94_0.04_162)]",
  },
  branches: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.28_0.05_180)] text-[oklch(0.9_0.04_180)] ring-1 ring-[oklch(0.68_0.13_180/0.4)] shadow-[0_0_16px_-4px_oklch(0.68_0.13_180/0.35)]",
    card: "border-[oklch(0.68_0.13_180/0.22)]",
    value: "text-[oklch(0.92_0.04_180)]",
  },
  active: {
    accent: "apex-stat-accent-success",
    topBar: "apex-stat-topbar-emerald",
    icon: "bg-[oklch(0.3_0.07_155)] text-[oklch(0.92_0.04_155)] ring-1 ring-[oklch(0.6_0.12_155/0.4)] shadow-[0_0_16px_-4px_oklch(0.6_0.12_155/0.35)]",
    card: "border-[oklch(0.6_0.12_155/0.22)]",
    value: "text-[oklch(0.92_0.04_155)]",
  },
  dueSoon: {
    accent: "apex-stat-accent-warning",
    topBar: "apex-stat-topbar-amber",
    icon: "bg-[oklch(0.34_0.06_75)] text-[oklch(0.92_0.04_75)] ring-1 ring-[oklch(0.72_0.12_75/0.4)] shadow-[0_0_16px_-4px_oklch(0.72_0.12_75/0.3)]",
    card: "border-[oklch(0.65_0.1_75/0.22)]",
    value: "text-[oklch(0.92_0.05_75)]",
  },
  expired: {
    accent: "apex-stat-accent-danger",
    topBar: "apex-stat-topbar-danger",
    icon: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)] shadow-[0_0_16px_-4px_oklch(0.65_0.14_25/0.35)]",
    card: "border-[oklch(0.58_0.12_25/0.25)]",
    value: "text-[oklch(0.94_0.04_25)]",
  },
  yearRevenue: {
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    icon: "bg-[oklch(0.32_0.06_162)] text-[oklch(0.92_0.04_162)] ring-1 ring-[oklch(0.69_0.16_162/0.4)] shadow-[0_0_16px_-4px_oklch(0.69_0.16_162/0.35)]",
    card: "border-[oklch(0.69_0.16_162/0.22)]",
    value: "text-[oklch(0.94_0.04_162)]",
  },
  payments: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.28_0.05_180)] text-[oklch(0.9_0.04_180)] ring-1 ring-[oklch(0.68_0.13_180/0.4)] shadow-[0_0_16px_-4px_oklch(0.68_0.13_180/0.35)]",
    card: "border-[oklch(0.68_0.13_180/0.22)]",
    value: "text-[oklch(0.92_0.04_180)]",
  },
  stockValue: {
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    icon: "bg-[oklch(0.28_0.05_300)] text-[oklch(0.9_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.38)] shadow-[0_0_16px_-4px_oklch(0.62_0.1_300/0.32)]",
    card: "border-[oklch(0.55_0.1_300/0.22)]",
    value: "text-[oklch(0.92_0.03_300)]",
  },
  staff: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.28_0.05_230)] text-[oklch(0.9_0.04_230)] ring-1 ring-[oklch(0.65_0.12_230/0.38)] shadow-[0_0_16px_-4px_oklch(0.65_0.12_230/0.32)]",
    card: "border-[oklch(0.65_0.12_230/0.2)]",
    value: "text-[oklch(0.92_0.03_230)]",
  },
  pendingSetupPayments: {
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    icon: "bg-[oklch(0.32_0.06_162)] text-[oklch(0.92_0.04_162)] ring-1 ring-[oklch(0.69_0.16_162/0.4)] shadow-[0_0_16px_-4px_oklch(0.69_0.16_162/0.35)]",
    card: "border-[oklch(0.69_0.16_162/0.22)]",
    value: "text-[oklch(0.94_0.04_162)]",
  },
  pendingYearlyPayments: {
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    icon: "bg-[oklch(0.28_0.05_300)] text-[oklch(0.9_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.38)] shadow-[0_0_16px_-4px_oklch(0.62_0.1_300/0.32)]",
    card: "border-[oklch(0.55_0.1_300/0.22)]",
    value: "text-[oklch(0.92_0.03_300)]",
  },
  pendingModuleRequests: {
    accent: "apex-stat-accent-violet",
    topBar: "apex-stat-topbar-violet",
    icon: "bg-[oklch(0.3_0.05_300)] text-[oklch(0.92_0.04_300)] ring-1 ring-[oklch(0.62_0.1_300/0.35)] shadow-[0_0_16px_-4px_oklch(0.62_0.1_300/0.28)]",
    card: "border-[oklch(0.55_0.1_300/0.18)]",
    value: "text-[oklch(0.92_0.03_300)]",
  },
  unreadFeedback: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.3_0.05_230)] text-[oklch(0.92_0.04_230)] ring-1 ring-[oklch(0.65_0.12_230/0.35)] shadow-[0_0_16px_-4px_oklch(0.65_0.12_230/0.3)]",
    card: "border-[oklch(0.65_0.12_230/0.2)]",
    value: "text-[oklch(0.92_0.03_230)]",
  },
};

export const APEX_BUTTON_PRIMARY =
  "cursor-pointer font-semibold shadow-md shadow-black/30 ring-1 ring-[oklch(0.69_0.16_162/0.45)] bg-linear-to-r from-[oklch(0.52_0.13_162)] to-[oklch(0.62_0.12_180)] text-white hover:brightness-110 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_GRADIENT = APEX_BUTTON_PRIMARY;

export const APEX_BUTTON_SUCCESS =
  "cursor-pointer font-semibold shadow-md shadow-black/25 ring-1 ring-[oklch(0.55_0.1_155/0.45)] bg-[oklch(0.48_0.1_155)] text-white hover:bg-[oklch(0.54_0.11_155)] active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_OUTLINE =
  "cursor-pointer font-medium border-2 border-white/16 bg-white/6 text-foreground shadow-sm hover:border-[oklch(0.69_0.05_162/0.35)] hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_DANGER =
  "cursor-pointer font-semibold shadow-md shadow-black/25 ring-1 ring-[oklch(0.58_0.14_25/0.4)] bg-[oklch(0.52_0.12_25)] text-white hover:bg-[oklch(0.58_0.14_25)] active:scale-[0.98] disabled:cursor-not-allowed";

/** Shared chart palette — emerald primary with teal/sky/violet/rose support. */
export const CHART_COLORS = {
  emerald: "oklch(0.69 0.16 162)",
  teal: "oklch(0.68 0.13 180)",
  sky: "oklch(0.65 0.12 230)",
  violet: "oklch(0.62 0.1 300)",
  rose: "oklch(0.62 0.16 25)",
  amber: "oklch(0.72 0.12 75)",
  slate: "oklch(0.55 0.02 265)",
} as const;
