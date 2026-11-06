"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getApexToken } from "./auth";
import {
  fetchDashboardSummary,
  invalidateApexCaches,
  type DashboardSummary,
} from "./actions";
import { mapApexApiError } from "./api";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";

type ApexDashboardContextValue = {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
};

const ApexDashboardContext = createContext<ApexDashboardContextValue | null>(null);

export function ApexDashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const coordinator = useLoadCoordinator();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSummaryRef = useRef(false);

  useEffect(() => {
    hasSummaryRef.current = summary != null;
  }, [summary]);

  const refresh = useCallback(
    async (force = false) => {
      if (!getApexToken()) {
        router.push("/");
        return;
      }
      if (force) invalidateApexCaches("apex:summary");

      await coordinator.run(async (isStale) => {
        const isInitial = !hasSummaryRef.current;
        if (isInitial) setLoading(true);
        setError(null);
        try {
          const data = await fetchDashboardSummary();
          if (!isStale()) setSummary(data);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load dashboard");
          if (!isStale() && msg) setError(msg);
        } finally {
          if (!isStale() && isInitial) setLoading(false);
        }
      });
    },
    [coordinator, router],
  );

  useEffect(() => {
    if (!getApexToken()) {
      router.push("/");
      return;
    }
    void refresh(false);
  }, [router, refresh]);

  const value = useMemo(
    () => ({ summary, loading, error, refresh }),
    [summary, loading, error, refresh],
  );

  return (
    <ApexDashboardContext.Provider value={value}>{children}</ApexDashboardContext.Provider>
  );
}

export function useApexDashboard() {
  const ctx = useContext(ApexDashboardContext);
  if (!ctx) {
    throw new Error("useApexDashboard must be used within ApexDashboardProvider");
  }
  return ctx;
}
