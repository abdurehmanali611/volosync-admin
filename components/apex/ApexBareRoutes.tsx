"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * Routes that render their page bare, without the Apex console shell.
 * Matched exactly (a prefix like `/tenants` must not bare `/tenants/[id]`).
 */
export const APEX_BARE_ROUTES = new Set<string>(["/"]);

/**
 * Hides `children` on bare routes.
 *
 * `usePathname()` suspends while an unknown dynamic param (`/tenants/[id]`)
 * is prerendering, which fails the build when `cacheComponents` is on — so
 * this hook never lives in the root layout. It sits below the per-route
 * layouts instead, each of which only covers routes whose pathname is known
 * at build time.
 */
export function ApexBareRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (APEX_BARE_ROUTES.has(pathname)) return null;
  return <>{children}</>;
}

/** Renders only on bare routes — the inverse of `ApexBareRouteGate`. */
export function ApexBareRouteOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!APEX_BARE_ROUTES.has(pathname)) return null;
  return <>{children}</>;
}
