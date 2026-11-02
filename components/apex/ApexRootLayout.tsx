"use client";

import { type ReactNode } from "react";
import { ApexAppLayout } from "@/components/apex/ApexAppLayout";

/**
 * Wraps the console routes in the Apex shell.
 *
 * This deliberately does NOT call `usePathname()`: the root layout is shared
 * by every route, including `/tenants/[id]`, and a pathname read there
 * suspends prerendering for unknown dynamic params (`CLIENT_HOOK_DYNAMIC`).
 * The bare-vs-shell decision lives in the per-route layouts instead.
 */
export function ApexRootLayout({ children }: { children: ReactNode }) {
  return <ApexAppLayout>{children}</ApexAppLayout>;
}
