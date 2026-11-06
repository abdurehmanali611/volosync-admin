"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexSalesAgentsTable } from "@/components/apex/sales/ApexSalesAgentsTable";
import {
  fetchApexSalesAgents,
  type SalesAgentRow,
} from "@/lib/apex/actions";

export default function SalesAgentsPage() {
  const [agents, setAgents] = useState<SalesAgentRow[] | null>(null);

  const reload = useCallback(async () => {
    try {
      setAgents(await fetchApexSalesAgents(false));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load sales agents");
      setAgents([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch into local agents state
    void reload();
  }, [reload]);

  if (agents === null) {
    return <ApexPageLoader label="Loading sales agents…" />;
  }

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Sales Agents"
        description="Register the people who sell VoloSync. They appear as an optional choice on signup and create tenant."
        breadcrumbs={[{ label: "Sales Agents" }]}
      />
      <ApexSalesAgentsTable agents={agents} onChanged={() => void reload()} />
    </div>
  );
}
