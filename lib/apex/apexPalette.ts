/** Apex dashboard color system — stat accents & button helpers */

export type ApexStatKey =
  | "pendingSetupPayments"
  | "pendingYearlyPayments"
  | "unreadFeedback"
  | "setupPendingTenants"
  | "billingHoldTenants"
  | "graceOrExpiredTenants"
  | "trialsEndingSoon"
  | "trialExpiredTenants"
  | "suspendedTenants"
  | "bannedTenants";

export const APEX_STAT_STYLES: Record<
  ApexStatKey,
  { accent: string; icon: string; card: string; value: string; topBar: string }
> = {
  pendingSetupPayments: {
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-gold",
    icon: "bg-[oklch(0.32_0.06_85)] text-[oklch(0.92_0.04_85)] ring-1 ring-[oklch(0.72_0.08_85/0.4)] shadow-[0_0_16px_-4px_oklch(0.72_0.08_85/0.35)]",
    card: "border-[oklch(0.72_0.08_85/0.22)]",
    value: "text-[oklch(0.94_0.04_85)]",
  },
  pendingYearlyPayments: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.4)] shadow-[0_0_16px_-4px_oklch(0.62_0.12_195/0.35)]",
    card: "border-[oklch(0.55_0.1_195/0.22)]",
    value: "text-[oklch(0.92_0.04_195)]",
  },
  unreadFeedback: {
    accent: "apex-stat-accent-teal",
    topBar: "apex-stat-topbar-teal",
    icon: "bg-[oklch(0.3_0.045_195)] text-[oklch(0.92_0.045_195)] ring-1 ring-[oklch(0.62_0.11_195/0.35)] shadow-[0_0_16px_-4px_oklch(0.62_0.11_195/0.3)]",
    card: "border-[oklch(0.55_0.11_195/0.2)]",
    value: "text-[oklch(0.92_0.035_195)]",
  },
  setupPendingTenants: {
    accent: "apex-stat-accent-gold",
    topBar: "apex-stat-topbar-amber",
    icon: "bg-[oklch(0.32_0.06_75)] text-[oklch(0.92_0.04_75)] ring-1 ring-[oklch(0.72_0.1_75/0.35)] shadow-[0_0_16px_-4px_oklch(0.72_0.1_75/0.3)]",
    card: "border-[oklch(0.65_0.1_75/0.2)]",
    value: "text-[oklch(0.94_0.04_75)]",
  },
  billingHoldTenants: {
    accent: "apex-stat-accent-warning",
    topBar: "apex-stat-topbar-amber",
    icon: "bg-[oklch(0.34_0.06_75)] text-[oklch(0.22_0.04_75)] ring-1 ring-[oklch(0.72_0.12_75/0.4)] shadow-[0_0_16px_-4px_oklch(0.72_0.12_75/0.3)]",
    card: "border-[oklch(0.65_0.1_75/0.22)]",
    value: "text-[oklch(0.92_0.05_75)]",
  },
  graceOrExpiredTenants: {
    accent: "apex-stat-accent-danger",
    topBar: "apex-stat-topbar-danger",
    icon: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)] shadow-[0_0_16px_-4px_oklch(0.65_0.14_25/0.35)]",
    card: "border-[oklch(0.58_0.12_25/0.25)]",
    value: "text-[oklch(0.94_0.04_25)]",
  },
  trialsEndingSoon: {
    accent: "apex-stat-accent-warning",
    topBar: "apex-stat-topbar-amber",
    icon: "bg-[oklch(0.3_0.045_82)] text-[oklch(0.9_0.045_82)] ring-1 ring-[oklch(0.62_0.11_82/0.35)] shadow-[0_0_16px_-4px_oklch(0.62_0.11_82/0.28)]",
    card: "border-[oklch(0.55_0.11_82/0.18)]",
    value: "text-[oklch(0.92_0.035_82)]",
  },
  trialExpiredTenants: {
    accent: "apex-stat-accent-danger",
    topBar: "apex-stat-topbar-danger",
    icon: "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)] shadow-[0_0_16px_-4px_oklch(0.65_0.14_25/0.35)]",
    card: "border-[oklch(0.58_0.12_25/0.25)]",
    value: "text-[oklch(0.94_0.04_25)]",
  },
  suspendedTenants: {
    accent: "apex-stat-accent-warning",
    topBar: "apex-stat-topbar-amber",
    icon: "bg-[oklch(0.32_0.05_55)] text-[oklch(0.92_0.04_55)] ring-1 ring-[oklch(0.65_0.08_55/0.35)] shadow-[0_0_16px_-4px_oklch(0.65_0.08_55/0.28)]",
    card: "border-[oklch(0.58_0.08_55/0.2)]",
    value: "text-[oklch(0.94_0.04_55)]",
  },
  bannedTenants: {
    accent: "apex-stat-accent-danger",
    topBar: "apex-stat-topbar-danger",
    icon: "bg-[oklch(0.3_0.07_25)] text-[oklch(0.94_0.04_25)] ring-1 ring-[oklch(0.65_0.16_25/0.45)] shadow-[0_0_16px_-4px_oklch(0.65_0.16_25/0.38)]",
    card: "border-[oklch(0.58_0.14_25/0.28)]",
    value: "text-[oklch(0.96_0.04_25)]",
  },
};

export const APEX_BUTTON_PRIMARY =
  "cursor-pointer font-semibold shadow-md shadow-black/30 ring-1 ring-[oklch(0.62_0.12_195/0.45)] bg-linear-to-r from-[oklch(0.58_0.12_195)] to-[oklch(0.68_0.08_85)] text-[oklch(0.12_0.02_265)] hover:brightness-110 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_GRADIENT = APEX_BUTTON_PRIMARY;

export const APEX_BUTTON_SUCCESS =
  "cursor-pointer font-semibold shadow-md shadow-black/25 ring-1 ring-[oklch(0.55_0.1_145/0.45)] bg-[oklch(0.48_0.1_145)] text-[oklch(0.97_0.02_145)] hover:bg-[oklch(0.54_0.11_145)] active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_OUTLINE =
  "cursor-pointer font-medium border-2 border-white/16 bg-white/6 text-foreground shadow-sm hover:border-[oklch(0.65_0.05_85/0.35)] hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed";

export const APEX_BUTTON_DANGER =
  "cursor-pointer font-semibold shadow-md shadow-black/25 ring-1 ring-[oklch(0.58_0.14_25/0.4)] bg-[oklch(0.52_0.12_25)] text-white hover:bg-[oklch(0.58_0.14_25)] active:scale-[0.98] disabled:cursor-not-allowed";
