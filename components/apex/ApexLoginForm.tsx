"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ArrowRight } from "lucide-react";
import { PendingButton } from "@/components/ui/pending-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apexLoginAction, mapLoginError } from "@/lib/admin/core";
import { getApexToken } from "@/lib/admin/session";
import { ApexLogo } from "@/components/apex/ApexLogo";

const loginSchema = z.object({
  username: z.string().trim().min(2, "Username required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Plain zod resolver — `@hookform/resolvers` is not installed in this app. */
const loginResolver: Resolver<LoginFormValues> = async (values) => {
  const parsed = loginSchema.safeParse(values);
  if (parsed.success) return { values: parsed.data, errors: {} };

  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) {
      errors[key] = { type: String(issue.code), message: issue.message };
    }
  }
  return { values: {}, errors: errors as FieldErrors<LoginFormValues> };
};

const fieldClass =
  "h-11 w-full border-border/60 bg-background/80 focus-visible:ring-primary/45";

export function ApexLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: loginResolver,
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (getApexToken()) router.push("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(t);
  }, [error]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-1 lg:hidden">
        <p className="text-sm font-medium text-muted-foreground">VoloSync · Apex</p>
        <h2 className="apex-gradient-text text-2xl font-bold tracking-tight">Sign in</h2>
      </div>

      <Card className="apex-glass-card overflow-hidden border-border/50 bg-card/95 shadow-2xl backdrop-blur-md">
        <div className="h-1 w-full bg-linear-to-r from-primary via-[oklch(0.68_0.13_180)] to-[oklch(0.62_0.1_300)]" />
        <div className="h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="hidden text-xl font-semibold lg:block">
            <span className="apex-gradient-text">Sign in</span>
          </CardTitle>
          <CardDescription>
            Single Apex operations credential (platform superuser or staff)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                setLoading(true);
                setError(null);
                try {
                  await apexLoginAction(values.username, values.password);
                  toast.success("Welcome back");
                  form.reset();
                  router.push("/dashboard");
                } catch (e) {
                  const msg = mapLoginError(e);
                  setError(msg);
                  toast.error(msg);
                } finally {
                  setLoading(false);
                }
              })}
            >
              <div className="flex flex-col items-center gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center sm:gap-6">
                <ApexLogo
                  size={72}
                  priority
                  className="drop-shadow-[0_0_20px_oklch(0.55_0.04_162/0.25)]"
                />
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  Apex Solution — operations & monitoring
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 [&_.flex]:w-full [&_input]:w-full">
                <CustomFormField
                  name="username"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Username"
                  placeholder="apex"
                  className={fieldClass}
                />
                <CustomFormField
                  name="password"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Password"
                  type="password"
                  placeholder="Your password"
                  className={fieldClass}
                />
                {error ? (
                  <div
                    role="alert"
                    className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  >
                    {error}
                  </div>
                ) : null}
                <PendingButton
                  type="submit"
                  size="lg"
                  className="group relative h-11 w-full overflow-hidden rounded-lg bg-linear-to-r from-apex-emerald via-[oklch(0.6_0.14_170)] to-apex-teal font-semibold text-white shadow-[0_8px_24px_-8px_var(--apex-emerald-glow),inset_0_1px_0_oklch(1_0_0/0.18)] transition-all duration-300 hover:shadow-[0_12px_30px_-8px_var(--apex-emerald-glow),inset_0_1px_0_oklch(1_0_0/0.25)] hover:brightness-110 focus-visible:ring-3 focus-visible:ring-apex-emerald/40 active:translate-y-px"
                  pending={loading}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span className="relative inline-flex items-center gap-2">
                    {loading ? "Signing in" : "Continue to dashboard"}
                    {loading ? null : (
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                  </span>
                </PendingButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
