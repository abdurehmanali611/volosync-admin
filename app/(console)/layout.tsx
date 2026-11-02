import type { ReactNode } from "react";
import { ApexRootLayout } from "@/components/apex/ApexRootLayout";

/**
 * Every console route renders inside the Apex shell.
 *
 * No `usePathname()` here — the route group *is* the decision. That also means
 * nothing above `/tenants/[id]`'s dynamic segment reads the pathname, which is
 * what broke prerendering (`CLIENT_HOOK_DYNAMIC`) when the root layout did it.
 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ApexRootLayout>{children}</ApexRootLayout>;
}
