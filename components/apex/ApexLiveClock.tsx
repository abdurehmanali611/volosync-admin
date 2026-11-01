"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApexLiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeLabel = format(now, "HH:mm:ss");

  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 backdrop-blur-sm lg:flex",
        className,
      )}
      role="timer"
      aria-label={`${format(now, "PPPP")}, ${timeLabel}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Clock3 className="h-3 w-3" strokeWidth={2.25} />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        Live
      </span>
      <span className="hidden text-[11px] text-muted-foreground xl:inline">
        {format(now, "MMM d, yyyy")}
      </span>
      <span className="font-mono text-xs tabular-nums tracking-tight text-foreground">
        {timeLabel}
      </span>
    </div>
  );
}
