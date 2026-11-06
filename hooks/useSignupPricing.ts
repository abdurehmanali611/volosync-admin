"use client";

import { useEffect, useState } from "react";
import { fetchSignupPricingPreview, type SignupPricingPreview } from "@/lib/signup/pricing";
import { calculateSignupPricing } from "@/lib/signup/subscriptionModules";
import type { BusinessType, ModuleOption } from "@/constants/signup";

export type SignupPricingState = SignupPricingPreview & { loading: boolean };

export function useSignupPricing(
  businessType: BusinessType,
  modules: readonly ModuleOption[],
): SignupPricingState {
  const baseline = calculateSignupPricing(businessType, modules);
  const [pricing, setPricing] = useState<SignupPricingState>({
    ...baseline,
    source: "local",
    differsFromDefault: false,
    loading: true,
  });

  const modulesKey = modules.join("|");

  useEffect(() => {
    let cancelled = false;
    setPricing((prev) => ({ ...prev, loading: true }));
    void fetchSignupPricingPreview(businessType, modules).then((result) => {
      if (!cancelled) {
        setPricing({ ...result, loading: false });
      }
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessType, modulesKey]);

  return pricing;
}
