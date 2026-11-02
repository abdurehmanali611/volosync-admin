import type { ReactNode } from "react";
import { ApexConsoleChrome } from "@/components/apex/ApexChrome";

/**
 * Every console route. The pathname check + Suspense boundary live here —
 * below `/tenants/[id]`'s dynamic segment, which is where the route's own
 * pages (and its `useSearchParams()` consumers) actually render.
 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ApexConsoleChrome>{children}</ApexConsoleChrome>;
}
