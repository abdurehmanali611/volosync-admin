"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  fetchFeedbackDirectory,
  invalidateApexCaches,
  type FeedbackDirectoryRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexErrorAlert } from "@/components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/components/apex/layout/ApexSearchInput";
import { ApexResultCount } from "@/components/apex/layout/ApexFilterTabs";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexStartChatDialog } from "@/components/apex/feedback/ApexStartChatDialog";
import { ApexBroadcastChatDialog } from "@/components/apex/feedback/ApexBroadcastChatDialog";
import { ApexFeedbackDirectoryTable } from "@/components/apex/feedback/ApexFeedbackDirectoryTable";
import { ApexTableSkeleton } from "@/components/apex/layout/ApexTableSkeleton";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function FeedbackPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading chats…" />}>
      <FeedbackList />
    </Suspense>
  );
}

function FeedbackList() {
  const searchParams = useSearchParams();
  const filterTin = searchParams.get("tin");
  const [search, setSearch] = useState("");
  const [allRows, setAllRows] = useState<FeedbackDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  const load = useCallback(
    (force = false) => {
      if (force) invalidateApexCaches("apex:feedback-dir");
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchFeedbackDirectory();
          if (!isStale()) setAllRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load wholesalers");
          if (!isStale() && msg) setError(msg);
        } finally {
          if (!isStale()) setLoading(false);
        }
      });
    },
    [coordinator],
  );

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allRows;
    if (filterTin) list = list.filter((t) => t.tinNumber === filterTin);
    if (q) {
      list = list.filter((t) => {
        const hay = `${t.hotelDisplayName} ${t.tinNumber}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [allRows, search, filterTin]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Wholesaler chat"
        description={
          filterTin
            ? `Filtered to TIN ${filterTin}`
            : "Message active wholesalers — reply to unread threads or start a new chat"
        }
        breadcrumbs={
          filterTin
            ? [{ label: "Wholesaler chat", href: "/feedback" }, { label: filterTin }]
            : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ApexBroadcastChatDialog onDone={() => load(true)} />
            <ApexStartChatDialog
              defaultTin={filterTin ?? undefined}
              onDone={() => load(true)}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ApexSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by business name or TIN…"
          className="sm:max-w-md"
        />
        <ApexResultCount
          shown={rows.length}
          total={allRows.length}
          noun="wholesalers"
        />
      </div>

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <div className="p-4 sm:p-6">
            <ApexTableSkeleton cols={5} />
          </div>
        ) : allRows.length === 0 ? (
          <div className="p-6">
            <ApexEmptyState
              icon={MessageCircle}
              title="No active wholesalers"
              description="Active VoloSync wholesalers will appear here for chat."
              action={<ApexStartChatDialog onDone={() => load(true)} />}
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <ApexEmptyState
              icon={MessageCircle}
              title="No wholesalers match"
              description={
                search.trim() || filterTin
                  ? "Try a different search term, or clear the TIN filter."
                  : "Every active wholesaler will appear here for chat."
              }
              action={
                filterTin ? (
                  <ApexStartChatDialog
                    defaultTin={filterTin}
                    onDone={() => load(true)}
                  />
                ) : undefined
              }
            />
          </div>
        ) : (
          <ApexFeedbackDirectoryTable
            rows={rows}
            onStarted={() => load(true)}
          />
        )}
      </ApexPanel>
    </div>
  );
}
