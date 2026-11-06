"use client";

import { useEffect, useState } from "react";
import { fetchAuditLogs, type AuditLogRow } from "@/lib/apex/actions";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexAuditLogTable } from "@/components/apex/audit/ApexAuditLogTable";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchAuditLogs(150);
        if (!isStale()) setRows(list);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load audit log");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [coordinator]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Audit log"
        description="Recent Apex operations on tenants, billing, and user access"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={5} />
        ) : (
          <ApexAuditLogTable rows={rows} />
        )}
      </ApexPanel>
    </div>
  );
}
