"use client";

import { Suspense, type ReactNode } from "react";
import { ApexShell } from "@/components/apex/ApexShell";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexDashboardProvider } from "@/lib/admin/dashboard";

export function ApexAppLayout({ children }: { children: ReactNode }) {
  return (
    <ApexDashboardProvider>
      <Suspense fallback={<ApexPageLoader fullScreen label="Loading…" />}>
        <ApexShell>{children}</ApexShell>
      </Suspense>
    </ApexDashboardProvider>
  );
}
