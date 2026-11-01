"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import {
  ApexPricingCatalog,
  EMPTY_DRAFT,
  PlanEditorDialog,
  type Draft,
} from "@/components/apex/platform/ApexPricingCatalog";
import { useSystemRefresh } from "@/hooks/useSystemRefresh";
import { mapApiError } from "@/lib/admin/core";
import {
  fetchPricingPlans,
  savePricingPlan,
  type PricingPlan,
} from "@/lib/admin/platform";

export default function PricingPage() {
  const [plans, setPlans] = React.useState<PricingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  const load = React.useCallback(() => setVersion((v) => v + 1), []);
  const refresh = () => load();

  // Reload with the shell's single system refresh button.
  useSystemRefresh(refresh);

  React.useEffect(() => {
    let alive = true;
    void fetchPricingPlans()
      .then((rows) => {
        if (!alive) return;
        setPlans(rows);
        setError(null);
      })
      .catch((e) => {
        if (alive)
          setError(mapApiError(e, "Could not load the pricing catalog."));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }
    setSaving(true);
    try {
      await savePricingPlan(draft, draft.id);
      toast.success(draft.id ? "Plan updated" : "Plan created");
      setDraft(null);
      load();
    } catch (e) {
      toast.error(mapApiError(e, "Could not save the plan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Pricing catalog"
        description="Yearly plans and per-module fees. The default active plan drives tenant fee recalculation."
        breadcrumbs={[
          { label: "Overview", href: "/dashboard" },
          { label: "Pricing catalog" },
        ]}

      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {loading ? (
        <ApexTableSkeleton cols={5} />
      ) : (
        <ApexPricingCatalog
          plans={plans}
          loading={loading}
          onChanged={load}
          onCreate={() => setDraft({ ...EMPTY_DRAFT })}
        />
      )}

      <PlanEditorDialog
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        onSubmit={submit}
      />
    </div>
  );
}
