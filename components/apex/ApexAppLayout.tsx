"use client";

import { Suspense, type ReactNode } from "react";
import { ApexShell } from "@/components/apex/ApexShell";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexDashboardProvider } from "@/lib/apex/dashboard-context";
import { CreateTenantSheetProvider } from "@/lib/apex/create-tenant-sheet";
import { ApexCreateTenantSheet } from "@/components/apex/onboarding/ApexCreateTenantSheet";

export function ApexAppLayout({ children }: { children: ReactNode }) {
  return (
    <CreateTenantSheetProvider>
      <ApexDashboardProvider>
        <Suspense fallback={<ApexPageLoader fullScreen label="Loading…" />}>
          <ApexShell>{children}</ApexShell>
          <ApexCreateTenantSheet />
        </Suspense>
      </ApexDashboardProvider>
    </CreateTenantSheetProvider>
  );
}
