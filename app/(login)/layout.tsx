import type { ReactNode } from "react";

/**
 * The sign-in route renders bare — no shell, no chrome, no pathname check.
 * The route group decides; nothing reads the URL.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
