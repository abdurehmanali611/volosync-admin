import {
  MODULE_OPTIONS,
  SIGNUP_COMING_SOON_BUSINESS_TYPES,
  SIGNUP_REQUIRED_MODULE_COMMON,
  type BusinessType,
  type ModuleOption,
} from "@/constants/signup";

export const BUSINESS_TYPE_SIGNUP_DESCRIPTIONS: Record<BusinessType, string> = {
  Company:
    "Head office — one wholesale account with its own stock, staff and finance.",
  Branch:
    "Satellite outlet under a company, sharing the owner's modules and pricing.",
};

export function isBusinessTypeComingSoon(type: BusinessType): boolean {
  return (SIGNUP_COMING_SOON_BUSINESS_TYPES as readonly string[]).includes(type);
}

export const SIGNUP_COMING_SOON_MODULES = [] as const satisfies readonly ModuleOption[];

export const MODULE_DESCRIPTIONS: Record<ModuleOption, string> = {
  "Credentials(Common)":
    "Grant and update staff login credentials for this wholesaler.",
  Inventory:
    "Store terminal, stock lots, suppliers, registration and stock movements.",
  "HR Module":
    "Employees, leave, attendance/shifts, documents, payroll, and incidents.",
  "Sales Role":
    "Sales agent logins, in-store settlement entries and the sales report.",
};

export type SignupPricing = {
  setupFeeETB: number;
  yearlyFeeETB: number;
};

export function isModuleComingSoon(mod: ModuleOption): boolean {
  return (SIGNUP_COMING_SOON_MODULES as readonly string[]).includes(mod);
}

export function isModuleRequiredAtSignup(
  mod: ModuleOption,
  _businessType: BusinessType,
): boolean {
  return mod === SIGNUP_REQUIRED_MODULE_COMMON;
}

export function isModuleDisabledAtSignup(
  mod: ModuleOption,
  businessType: BusinessType,
): boolean {
  return isModuleComingSoon(mod) || isModuleRequiredAtSignup(mod, businessType);
}

export function getSignupDisabledReason(
  mod: ModuleOption,
  businessType: BusinessType,
): string | null {
  if (isModuleComingSoon(mod)) return "Coming soon";
  if (isModuleRequiredAtSignup(mod, businessType)) return "Included";
  return null;
}

export function getDefaultSignupModules(
  _businessType: BusinessType,
): ModuleOption[] {
  return [SIGNUP_REQUIRED_MODULE_COMMON];
}

export function normalizeSignupModules(
  businessType: BusinessType,
  selected: readonly ModuleOption[],
): ModuleOption[] {
  const allowed = new Set<ModuleOption>();
  for (const mod of MODULE_OPTIONS) {
    if (
      isModuleDisabledAtSignup(mod, businessType) &&
      !isModuleRequiredAtSignup(mod, businessType)
    ) {
      continue;
    }
    if (selected.includes(mod)) allowed.add(mod);
  }
  for (const req of getDefaultSignupModules(businessType)) {
    allowed.add(req);
  }
  return MODULE_OPTIONS.filter((m) => allowed.has(m));
}

/** Offline baseline — the Apex pricing catalog is authoritative for real fees. */
export function calculateSignupPricing(
  _businessType: BusinessType,
  _modules: readonly ModuleOption[],
): SignupPricing {
  return { setupFeeETB: 0, yearlyFeeETB: 0 };
}

export function formatETB(amount: number): string {
  return `${amount.toLocaleString("en-ET")} ETB`;
}

/** Primary tenant login role created at signup. */
export function tenantPrimaryRole(
  businessType: BusinessType,
): "Admin" | "Manager" {
  return businessType === "Branch" ? "Manager" : "Admin";
}

/** @deprecated use tenantPrimaryRole */
export function ownerRoleForBusinessType(
  businessType: BusinessType,
): "Admin" | "Manager" {
  return tenantPrimaryRole(businessType);
}

export function tenantPrimaryAccountTitle(businessType: BusinessType): string {
  return tenantPrimaryRole(businessType) === "Manager"
    ? "Manager account"
    : "Admin account";
}

export function tenantPrimaryAccountDescription(
  businessType: BusinessType,
): string {
  const role = tenantPrimaryRole(businessType);
  if (role === "Manager") {
    return "Manager login for this branch — grants access to the volosync manager dashboard.";
  }
  return "Admin login for this wholesaler — grants access to the volosync admin dashboard.";
}
