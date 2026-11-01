"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApexToken } from "@/lib/admin/session";

/** Sends unauthenticated visitors back to the login page. Returns auth state. */
export function useApexRouteGuard() {
  const router = useRouter();
  const authed = Boolean(getApexToken());

  useEffect(() => {
    if (!getApexToken()) {
      router.push("/");
    }
  }, [router]);

  return authed;
}
