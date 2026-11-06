"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  fetchModuleChangeRequests,
  invalidateApexCaches,
  type ModuleChangeRequestRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexModuleRequestsTable } from "@/components/apex/modules/ApexModuleRequestsTable";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function ModulesPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading module requests…" />}>
      <ModulesContent />
    </Suspense>
  );
}

function ModulesContent() {
  const [rows, setRows] = useState<ModuleChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  const load = useCallback(
    (force = false) => {
      if (force) invalidateApexCaches("apex:modules");
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchModuleChangeRequests("all");
          if (!isStale()) setRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load module requests");
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
        title="Module requests"
        description="Wholesalers requesting module additions or removals — review pending items first"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : (
          <ApexModuleRequestsTable rows={rows} onChanged={() => load(true)} />
        )}
      </ApexPanel>
    </div>
  );
}
