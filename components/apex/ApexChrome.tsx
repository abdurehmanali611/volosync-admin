"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ApexLogo } from "@/components/apex/ApexLogo";

/**
 * Route-aware chrome that lives BELOW the root layout, in route layouts.
 *
 * `usePathname()` suspends while an unknown dynamic param (e.g.
 * `/tenants/[id]`) is prerendering, which fails the build. The root layout
 * wraps every route, so it must never call that hook — only these components
 * do, from layouts whose pathname is known at build time.
 */

/** Console shell for every route except the sign-in page. */
export function ApexConsoleChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  // ApexShell reads useSearchParams, so it needs a Suspense boundary.
  return <Suspense fallback={<ApexChromeFallback />}>{children}</Suspense>;
}

/** Renders only on the sign-in route. */
export function ApexLoginChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <>{children}</>;
}

/** Static stand-in while the pathname resolves or the session is checked. */
export function ApexChromeFallback() {
  return (
    <div className="apex-canvas apex-loading-screen flex min-h-svh flex-col items-center justify-center gap-6">
      <ApexLogo size={56} priority className="apex-loading-pulse opacity-90" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Preparing your workspace
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Verifying session…</p>
      </div>
    </div>
  );
}
