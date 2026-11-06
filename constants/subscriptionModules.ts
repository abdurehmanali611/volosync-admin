/** Modules Apex can assign; names must match volosync tenant module keys. */
export const APEX_SUBSCRIPTION_MODULES = [
  "Inventory",
  "HR Module",
  "Sales Role",
] as const;

export type ApexSubscriptionModule = (typeof APEX_SUBSCRIPTION_MODULES)[number];
