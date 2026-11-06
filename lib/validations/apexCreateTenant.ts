import { z } from "zod";
import {
  BUSINESS_TYPES,
  MODULE_OPTIONS,
  SIGNUP_REQUIRED_MODULES_DEFAULT,
} from "@/constants/signup";
import {
  isBusinessTypeComingSoon,
  isModuleComingSoon,
  isModuleDisabledAtSignup,
  normalizeSignupModules,
} from "@/lib/signup/subscriptionModules";

const businessTypeEnum = z.enum(BUSINESS_TYPES, {
  message: "Please select the company type",
});
const moduleEnum = z.enum(MODULE_OPTIONS, {
  message: "Please select modules",
});

export const ApexCreateTenantSchema = z
  .object({
    BusinessName: z.string().min(1, "Business name is required"),
    LogoUrl: z.string().min(2, "Please upload the business logo"),
    UserName: z.string().trim().min(2, "Username is required"),
    Password: z.string().min(6, "Password must be at least 6 characters"),
    tinNumber: z
      .string()
      .refine(
        (s) => {
          const t = s.trim();
          return t === "" || /^\d{10}$/.test(t);
        },
        {
          message:
            "TIN must be exactly 10 digits, or leave blank for a server-assigned id",
        },
      ),
    type: businessTypeEnum,
    modules: z.array(moduleEnum).min(1, "Please select at least one module"),
    salesAgentId: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (isBusinessTypeComingSoon(data.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.type} registration is coming soon.`,
        path: ["type"],
      });
      return;
    }

    const selected = new Set(data.modules);
    const required = SIGNUP_REQUIRED_MODULES_DEFAULT;

    for (const req of required) {
      if (!selected.has(req)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Registration must include "${req}"`,
          path: ["modules"],
        });
      }
    }

    for (const mod of data.modules) {
      if (isModuleComingSoon(mod)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${mod}" is not available yet`,
          path: ["modules"],
        });
      }
      if (
        isModuleDisabledAtSignup(mod, data.type) &&
        !required.includes(mod as (typeof required)[number])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${mod}" cannot be selected for this company type`,
          path: ["modules"],
        });
      }
    }

    normalizeSignupModules(data.type, data.modules);
  });

export type ApexCreateTenantFormValues = z.infer<typeof ApexCreateTenantSchema>;
