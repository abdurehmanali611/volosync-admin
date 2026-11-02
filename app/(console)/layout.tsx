import type { ReactNode } from "react";
import { ApexBareRouteGate } from "@/components/apex/ApexBareRoutes";

/**
 * Layout for every Apex console route (everything except the login page).
 *
 * Kept separate from the root layout so the bare-route check — which reads
 * `usePathname()` — only covers routes under here. A pathname read in the
 * root layout would block prerendering of `/tenants/[id]`, whose dynamic
 * param isn't known at build time.
 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ApexBareRouteGate>{children}</ApexBareRouteGate>;
}
