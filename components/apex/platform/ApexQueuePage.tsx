"use client";

import * as React from "react";
import { useSystemRefresh } from "@/hooks/useSystemRefresh";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";

import { mapApiError } from "@/lib/admin/core";

type QueueState<T> = {
  rows: T[];
  loading: boolean;
  error: string | null;
  reload: (force?: boolean) => void;
  setError: (message: string | null) => void;
};

/**
 * Standard list-page loader: fetch on mount, optional force reload, and a
 * single place that turns API failures into a friendly message.
 */
export function useQueue<T>(
  load: () => Promise<T[]>,
  deps: unknown[] = [],
): QueueState<T> {
  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(deps.length > 0);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  const reload = React.useCallback(() => setVersion((v) => v + 1), []);

  // The shell's system refresh button reloads this page too.
  useSystemRefresh(reload);

  React.useEffect(() => {
    let alive = true;
    void load()
      .then((next) => {
        if (!alive) return;
        setRows(next);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        const message = mapApiError(e, "Could not load this queue.");
        if (message) setError(message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return { rows, loading, error, reload, setError };
}

/** Page frame shared by every queue/list screen. */
export function ApexQueuePage({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  loading,
  error,
  columns = 6,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  columns?: number;
}) {
  return (
    <div className="space-y-6">
      <ApexPageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      {error ? <ApexErrorAlert message={error} /> : null}
      {loading ? <ApexTableSkeleton cols={columns} /> : children}
    </div>
  );
}

/** Small stat strip used at the top of queue pages. */
export function ApexQueueStats({
  items,
}: {
  items: {
    label: string;
    value: React.ReactNode;
    tone?: "emerald" | "amber" | "danger" | "sky";
  }[];
}) {
  const tones: Record<string, string> = {
    emerald: "text-apex-emerald",
    amber: "text-apex-amber",
    danger: "text-apex-danger",
    sky: "text-apex-sky",
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="apex-panel-surface rounded-xl border border-white/6 px-4 py-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {item.label}
          </p>
          <p
            className={`mt-1 text-xl font-semibold tabular-nums ${item.tone ? tones[item.tone] : ""}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export const dateLabel = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const dateTimeLabel = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
