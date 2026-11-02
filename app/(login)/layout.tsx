import type { ReactNode } from "react";
import { ApexLoginChrome } from "@/components/apex/ApexChrome";

/**
 * The sign-in route (`/`). Its pathname is static, so the check inside
 * `ApexLoginChrome` resolves during prerendering — no build-time suspension.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <ApexLoginChrome>{children}</ApexLoginChrome>;
}
