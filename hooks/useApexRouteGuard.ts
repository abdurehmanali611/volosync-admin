"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApexToken } from "@/lib/apex/auth";

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
