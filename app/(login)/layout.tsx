import type { ReactNode } from "react";
import { ApexBareRouteOnly } from "@/components/apex/ApexBareRoutes";

/**
 * Layout for the sign-in route only. Its pathname (`/`) is static, so the
 * bare-route check here never blocks prerendering.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <ApexBareRouteOnly>{children}</ApexBareRouteOnly>;
}
