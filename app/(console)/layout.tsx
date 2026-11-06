import type { ReactNode } from "react";
import { ApexAppLayout } from "@/components/apex/ApexAppLayout";

/**
 * The route group is the shell decision, so nothing reads the pathname in a
 * client layout. With `cacheComponents` on, `usePathname()` above a route would
 * block prerendering every console route.
 */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ApexAppLayout>{children}</ApexAppLayout>;
}
