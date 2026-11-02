"use client";

import { Suspense, type ReactNode } from "react";
import { ApexShell } from "@/components/apex/ApexShell";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexDashboardProvider } from "@/lib/admin/dashboard";

/**
 * Console shell wrapper, mounted by `app/(console)/layout.tsx`.
 *
 * Deliberately does NOT call `usePathname()`: the shell is chosen by the
 * route group, not by inspecting the URL. A pathname read anywhere above
 * `/tenants/[id]` suspends prerendering for that dynamic param and fails the
 * build (`CLIENT_HOOK_DYNAMIC`); at runtime it can leave the app stuck on the
 * pending shell.
 *
 * The Suspense boundary is required because `ApexShell` reads
 * `useSearchParams()`.
 */
export function ApexRootLayout({ children }: { children: ReactNode }) {
  return (
    <ApexDashboardProvider>
      <Suspense fallback={<ApexPageLoader fullScreen label="Loading…" />}>
        <ApexShell>{children}</ApexShell>
      </Suspense>
    </ApexDashboardProvider>
  );
}
