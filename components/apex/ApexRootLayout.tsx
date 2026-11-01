"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { ApexAppLayout } from "@/components/apex/ApexAppLayout";

/** Wraps authenticated routes in the Apex shell; `/` stays bare for sign-in. */
export function ApexRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <>{children}</>;
  }
  return <ApexAppLayout>{children}</ApexAppLayout>;
}
