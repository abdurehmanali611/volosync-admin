"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import {
  fetchMonthlySignups,
  invalidateApexCaches,
  type MonthlySignupRow,
} from "@/lib/apex/actions";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { ApexSignupsTable } from "@/components/apex/signups/ApexSignupsTable";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { mapApexApiError } from "@/lib/apex/api";
import { ApexCreateTenantTrigger } from "@/components/apex/onboarding/ApexCreateTenantTrigger";
import {
  APEX_BANK_ACCOUNT,
  APEX_BANK_NAME,
  APEX_ESCALATION_WHATSAPP,
} from "@/constants/apexContacts";

export default function SignupsPage() {
  const [rows, setRows] = useState<MonthlySignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();
  const { refresh: refreshSummary } = useApexDashboard();

  const load = useCallback(
    (force = false) => {
      if (force) {
        invalidateApexCaches("apex:signups");
        invalidateApexCaches("apex:tenants");
        invalidateApexCaches("apex:tenant-payments");
        invalidateApexCaches("apex:payments");
      }
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchMonthlySignups();
          if (!isStale()) setRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load signups");
          if (!isStale() && msg) setError(msg);
        } finally {
          if (!isStale()) setLoading(false);
        }
      });
    },
    [coordinator],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="New signups"
        description="Wholesalers that signed up this month — filter by pending, approved, or rejected setup"
        actions={
          <ApexCreateTenantTrigger size="sm" variant="apex" className="h-9 px-4">
            Create tenant manually
          </ApexCreateTenantTrigger>
        }
      />

      <ApexInfoBanner icon={Phone}>
        {APEX_ESCALATION_WHATSAPP.length > 0 ? (
          <>
            Escalation WhatsApp: {APEX_ESCALATION_WHATSAPP.join(" · ")}
            {APEX_BANK_ACCOUNT ? " · " : ""}
          </>
        ) : null}
        {APEX_BANK_ACCOUNT ? (
          <>
            {APEX_BANK_NAME} account{" "}
            <span className="font-mono">{APEX_BANK_ACCOUNT}</span>
          </>
        ) : null}
        {APEX_ESCALATION_WHATSAPP.length === 0 && !APEX_BANK_ACCOUNT
          ? "Configure the Apex escalation contacts to show them on this page."
          : null}
      </ApexInfoBanner>

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={8} />
        ) : (
          <ApexSignupsTable
            rows={rows}
            onChanged={() => {
              load(true);
              void refreshSummary(true);
            }}
          />
        )}
      </ApexPanel>
    </div>
  );
}
