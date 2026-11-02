"use client";

import { type ReactNode } from "react";
import { ApexAppLayout } from "@/components/apex/ApexAppLayout";

/**
 * Wraps console routes in the Apex shell.
 *
 * Deliberately does NOT call `usePathname()`: the root layout wraps every
 * route, including `/tenants/[id]`, and a pathname read there suspends
 * prerendering for unknown dynamic params (`CLIENT_HOOK_DYNAMIC`). The
 * bare-vs-shell decision lives in `ApexChrome` inside the route layouts.
 */
export function ApexRootLayout({ children }: { children: ReactNode }) {
  return <ApexAppLayout>{children}</ApexAppLayout>;
}
