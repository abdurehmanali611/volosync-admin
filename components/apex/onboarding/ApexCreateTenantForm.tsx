"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import {
  SignupModuleSelector,
  SignupPricingSummary,
} from "@/components/signup/SignupModuleSelector";
import { SignupApexAccessSection } from "@/components/signup/SignupApexAccessSection";
import { SalesAgentSelector } from "@/components/signup/SalesAgentSelector";
import { PendingButton } from "@/components/ui/pending-button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SIGNUP_REQUIRED_MODULES_DEFAULT,
  type BusinessType,
} from "@/constants/signup";
import { useSignupPricing } from "@/hooks/useSignupPricing";
import {
  getDefaultSignupModules,
  normalizeSignupModules,
  tenantPrimaryAccountDescription,
  tenantPrimaryAccountTitle,
  tenantPrimaryRole,
} from "@/lib/signup/subscriptionModules";
import {
  ApexCreateTenantSchema,
  type ApexCreateTenantFormValues,
} from "@/lib/validations/apexCreateTenant";
import { uploadSignupImage } from "@/lib/signup/upload";
import {
  apexCreateTenant,
  fetchApexSalesAgents,
  type SalesAgentRow,
  type TenantOnboardingResult,
} from "@/lib/apex/actions";

function SignupSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type Props = {
  onCreated?: (result: TenantOnboardingResult) => void;
  onNavigateWithoutOwner?: () => void;
};

export function ApexCreateTenantForm({ onCreated, onNavigateWithoutOwner }: Props) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPaymentReceived, setConfirmPaymentReceived] = useState(true);
  const [isIllustrationTenant, setIsIllustrationTenant] = useState(false);
  const [billingNotes, setBillingNotes] = useState("");
  const [salesAgents, setSalesAgents] = useState<SalesAgentRow[]>([]);
  const [salesAgentsLoading, setSalesAgentsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchApexSalesAgents(true)
      .then((rows) => {
        if (!cancelled) setSalesAgents(rows);
      })
      .catch(() => {
        if (!cancelled) setSalesAgents([]);
      })
      .finally(() => {
        if (!cancelled) setSalesAgentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<ApexCreateTenantFormValues>({
    resolver: zodResolver(ApexCreateTenantSchema),
    defaultValues: {
      BusinessName: "",
      LogoUrl: "",
      UserName: "",
      Password: "",
      tinNumber: "",
      type: "Company",
      modules: [...SIGNUP_REQUIRED_MODULES_DEFAULT],
      salesAgentId: null,
    },
  });

  const businessType: BusinessType = "Company";

  const selectedModules = useWatch({
    control: form.control,
    name: "modules",
  });

  const modulesForPricing =
    selectedModules ?? getDefaultSignupModules(businessType);
  const pricing = useSignupPricing(businessType, modulesForPricing);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(async (values) => {
          setIsLoading(true);
          try {
            const modules = normalizeSignupModules(values.type, values.modules);
            const result = await apexCreateTenant({
              businessName: values.BusinessName.trim(),
              userName: values.UserName.trim(),
              password: values.Password,
              businessType: values.type,
              modules,
              logoUrl: values.LogoUrl,
              tinNumber: values.tinNumber.trim() || null,
              confirmPaymentReceived,
              isIllustrationTenant,
              billingNotes: billingNotes.trim() || null,
              salesAgentId: values.salesAgentId ?? null,
            });

            toast.success(
              result.setupFeeApproved
                ? `Tenant created — ${result.ownerRole} ${result.ownerUserName} can log in now`
                : `Tenant created — pending setup approval`,
            );
            if (onCreated) {
              onCreated(result);
            } else {
              router.push(`/tenants/${encodeURIComponent(result.tinNumber)}`);
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create tenant");
          } finally {
            setIsLoading(false);
          }
        })}
      >
        <SignupSection
          title="Business details"
          description="Legal name and optional TIN for the wholesaler."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomFormField
              name="BusinessName"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Business name"
              placeholder="Registered business name"
              className="h-11 w-full"
            />
            <CustomFormField
              name="tinNumber"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="TIN (optional)"
              placeholder="10 digits, or leave blank"
              className="h-11 w-full"
            />
          </div>
          <FormField
            control={form.control}
            name="salesAgentId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Sales agent (optional)</FormLabel>
                <SalesAgentSelector
                  value={field.value ?? null}
                  onChange={field.onChange}
                  agents={salesAgents}
                  loading={salesAgentsLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave unselected if the customer found VoloSync on their own.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </SignupSection>

        <Separator />

        <SignupSection
          title={tenantPrimaryAccountTitle(businessType)}
          description={tenantPrimaryAccountDescription(businessType)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomFormField
              name="UserName"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label={`${tenantPrimaryRole(businessType)} username`}
              placeholder="Choose a username"
              className="h-11 w-full"
            />
            <CustomFormField
              name="Password"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label={`${tenantPrimaryRole(businessType)} password`}
              placeholder="Choose a password"
              className="h-11 w-full"
              type="password"
            />
          </div>
        </SignupSection>

        <Separator />

        <SignupSection title="Modules & pricing">
          <FormField
            control={form.control}
            name="modules"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="sr-only">Modules</FormLabel>
                <SignupModuleSelector
                  businessType={businessType}
                  value={field.value ?? []}
                  onChange={(next) =>
                    field.onChange(normalizeSignupModules(businessType, next))
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <SignupPricingSummary
            businessType={businessType}
            modules={selectedModules ?? getDefaultSignupModules(businessType)}
          />
        </SignupSection>

        <Separator />

        <SignupSection
          title="Access & billing"
          description="Apex-only — replaces the customer payment step on self-service signup."
        >
          <SignupApexAccessSection
            confirmPaymentReceived={confirmPaymentReceived}
            onConfirmPaymentReceivedChange={setConfirmPaymentReceived}
            isIllustrationTenant={isIllustrationTenant}
            onIllustrationTenantChange={setIsIllustrationTenant}
            billingNotes={billingNotes}
            onBillingNotesChange={setBillingNotes}
            roleLabel={tenantPrimaryRole(businessType)}
          />
        </SignupSection>

        <Separator />

        <SignupSection title="Branding">
          <CustomFormField
            name="LogoUrl"
            control={form.control}
            fieldType={formFieldTypes.IMAGE_UPLOADER}
            label="Business logo"
            placeholder="Upload logo"
            previewUrl={previewUrl}
            handleCloudinary={(result) =>
              uploadSignupImage(result, form, setPreviewUrl, "LogoUrl")
            }
          />
        </SignupSection>

        <PendingButton
          type="submit"
          pending={isLoading || pricing.loading}
          className="h-12 w-full cursor-pointer bg-green-600 text-base font-semibold shadow-md hover:bg-green-700"
        >
          {isLoading
            ? "Creating tenant…"
            : pricing.loading
              ? "Loading pricing…"
              : pricing.setupFeeETB > 0
                ? `Create tenant · ${pricing.setupFeeETB.toLocaleString("en-ET")} ETB setup`
                : "Create tenant"}
        </PendingButton>

        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="shrink-0 rounded-lg border border-primary/20 bg-primary/10 p-2.5">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold tracking-tight">
                Wholesaler already exists?
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                Add an Admin or Manager login to an existing tenant account.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 border-primary/25 font-semibold hover:bg-primary/5 sm:min-w-40"
            onClick={() => {
              onNavigateWithoutOwner?.();
              router.push("/tenants/without-owner");
            }}
          >
            Missing Admin/Manager
          </Button>
        </div>
      </form>
    </Form>
  );
}
