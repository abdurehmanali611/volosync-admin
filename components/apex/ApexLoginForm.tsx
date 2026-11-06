"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { PendingButton } from "@/components/ui/pending-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apexLoginAction, mapApexLoginError } from "@/lib/apex/actions";
import { getApexToken } from "@/lib/apex/auth";
import { ApexLogo } from "@/components/apex/ApexLogo";

const schema = z.object({
  UserName: z.string().trim().min(2, "Username required"),
  Password: z.string().min(6, "Password required"),
});

const fieldClass =
  "h-11 w-full border-border/60 bg-background/80 focus-visible:ring-primary/45";

export function ApexLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { UserName: "", Password: "" },
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
        <p className="text-sm font-medium text-muted-foreground">Apex · VoloSync</p>
        <h2 className="apex-gradient-text text-2xl font-bold tracking-tight">Sign in</h2>
      </div>

      <Card className="apex-glass-card gap-6 overflow-hidden border-border/50 bg-card/95 py-6 shadow-2xl backdrop-blur-md">
        <div className="h-1 w-full bg-linear-to-r from-primary via-[var(--apex-gold)] to-[var(--apex-teal)]" />
        <div className="h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader className="space-y-1 px-6 pb-2">
          <CardTitle className="hidden text-xl font-semibold lg:block">
            <span className="apex-gradient-text">Sign in</span>
          </CardTitle>
          <CardDescription>
            Single Apex operations credential (Django platform admin)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                setLoading(true);
                setError(null);
                try {
                  await apexLoginAction(values.UserName, values.Password);
                  toast.success("Welcome back");
                  form.reset();
                  router.push("/dashboard");
                } catch (e) {
                  const msg = mapApexLoginError(e);
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
                  className="drop-shadow-[0_0_20px_oklch(0.55_0.04_85/0.25)]"
                />
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  Apex Solution — operations & monitoring
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 [&_.flex]:w-full [&_input]:w-full">
                <CustomFormField
                  name="UserName"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Username"
                  placeholder="apex"
                  className={fieldClass}
                />
                <CustomFormField
                  name="Password"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Password"
                  type="password"
                  placeholder="Your admin password"
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
                  variant="apex"
                  size="lg"
                  className="h-11 w-full"
                  pending={loading}
                >
                  Continue to dashboard
                </PendingButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
