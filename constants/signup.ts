/** Signup constants aligned with volosync — keep in sync for module keys and company axes. */

export const BUSINESS_TYPES = ["Company", "Branch"] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SIGNUP_COMING_SOON_BUSINESS_TYPES = [] as const satisfies readonly BusinessType[];

export const MODULE_OPTIONS = [
  "Credentials(Common)",
  "Inventory",
  "HR Module",
  "Sales Role",
] as const;

export type ModuleOption = (typeof MODULE_OPTIONS)[number];

export const SIGNUP_REQUIRED_MODULE_COMMON = "Credentials(Common)" as const;

/** Common credentials are the only always-on module on either axis. */
export const SIGNUP_REQUIRED_MODULES_DEFAULT = [
  SIGNUP_REQUIRED_MODULE_COMMON,
] as const satisfies readonly ModuleOption[];
