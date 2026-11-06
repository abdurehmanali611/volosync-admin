"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  hotelDisplayName: string;
  tinNumber: string;
  threadId: number | null;
  unreadFromTenant: number;
  senderSide: string;
  body: string;
  createdAt?: string | null;
  className?: string;
};

function senderLabel(senderSide: string) {
  return String(senderSide).toLowerCase() === "tenant" ? "Tenant" : "Apex";
}

function formatMessageTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function ApexFeedbackConversationTrigger({
  hotelDisplayName,
  tinNumber,
  threadId,
  unreadFromTenant,
  senderSide,
  body,
  createdAt,
  className,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const schedulePreviewOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 220);
  };

  const schedulePreviewClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 160);
  };

  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  const from = senderLabel(senderSide);
  const when = formatMessageTime(createdAt);

  return (
    <>
      <Popover
        open={previewOpen && !sheetOpen}
        onOpenChange={(next) => {
          if (!next) setPreviewOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/detail max-w-[16rem] rounded-md text-left outline-none transition-colors sm:max-w-[20rem]",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40",
              "cursor-pointer",
              className,
            )}
            onMouseEnter={schedulePreviewOpen}
            onMouseLeave={schedulePreviewClose}
            onFocus={schedulePreviewOpen}
            onBlur={schedulePreviewClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSheet();
              }
            }}
            aria-label={`Preview last message for ${hotelDisplayName}`}
          >
            <span className="inline-flex max-w-full items-start gap-1">
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {from}
                  </span>
                  {unreadFromTenant > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-100">
                      {unreadFromTenant} unread
                    </span>
                  ) : null}
                </span>
                <span className="block truncate text-sm leading-snug text-foreground/90">
                  {body}
                </span>
              </span>
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/detail:opacity-70" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="flex max-h-[min(80vh,24rem)] w-[min(100vw-2rem,26rem)] flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold wrap-break-word">
                {hotelDisplayName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Last message · {from}
                {when ? ` · ${when}` : ""}
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word text-foreground/95">
              {body}
            </p>
          </div>
          <div className="shrink-0 border-t border-border/60 bg-popover p-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full cursor-pointer"
              onClick={openSheet}
            >
              Open full message
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100%,32rem)] data-[side=right]:max-w-[min(100%,32rem)] data-[side=right]:sm:w-lg data-[side=right]:sm:max-w-lg"
        >
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-5 py-4 pr-14 text-left">
            <SheetTitle className="text-base leading-snug wrap-break-word">
              {hotelDisplayName}
            </SheetTitle>
            <SheetDescription className="text-xs leading-snug wrap-break-word">
              Last message from {from}
              {when ? ` · ${when}` : ""}
              {unreadFromTenant > 0
                ? ` · ${unreadFromTenant} unread`
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 min-w-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 shrink-0 opacity-70" />
                Message
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
                {body}
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground break-all">
              TIN {tinNumber}
            </p>
            {threadId ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/feedback/${threadId}`}>Open chat thread</Link>
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
