import {
  fetchSignupPricingPreview as fetchApexPricing,
  type SignupPricingPreview as ApexSignupPricingPreview,
} from "@/lib/apex/actions";
import {
  calculateSignupPricing,
  type SignupPricing,
} from "@/lib/signup/subscriptionModules";
import type { BusinessType, ModuleOption } from "@/constants/signup";

export type SignupPricingSource = "catalog" | "fallback" | "local";

export type SignupPricingPreview = SignupPricing & {
  source: SignupPricingSource;
  differsFromDefault: boolean;
};

function withBaselineCompare(
  businessType: BusinessType,
  modules: readonly ModuleOption[],
  fees: SignupPricing,
  source: SignupPricingSource,
): SignupPricingPreview {
  const baseline = calculateSignupPricing(businessType, modules);
  const differsFromDefault =
    fees.setupFeeETB !== baseline.setupFeeETB ||
    fees.yearlyFeeETB !== baseline.yearlyFeeETB;
  return { ...fees, source, differsFromDefault };
}

export async function fetchSignupPricingPreview(
  businessType: BusinessType,
  modules: readonly ModuleOption[],
): Promise<SignupPricingPreview> {
  const fallback = calculateSignupPricing(businessType, modules);

  try {
    const row: ApexSignupPricingPreview = await fetchApexPricing(
      businessType,
      [...modules],
    );
    const fees = {
      setupFeeETB: Number(row.setupFeeETB) || 0,
      yearlyFeeETB: Number(row.yearlyFeeETB) || 0,
    };
    const source: SignupPricingSource =
      row.source === "catalog" ? "catalog" : "fallback";
    return withBaselineCompare(businessType, modules, fees, source);
  } catch {
    return withBaselineCompare(businessType, modules, fallback, "local");
  }
}
