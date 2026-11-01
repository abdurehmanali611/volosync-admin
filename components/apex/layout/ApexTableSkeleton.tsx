import { Skeleton } from "@/components/ui/skeleton";

export function ApexTableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="apex-table-skeleton p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
        <Skeleton className="hidden h-10 w-28 rounded-lg sm:block" />
      </div>
      <div className="overflow-hidden rounded-lg border border-white/6">
        <div className="flex gap-3 border-b border-white/8 bg-white/3 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1 rounded-md" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5 last:border-0"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-4 flex-1 rounded-md"
                style={{ opacity: 1 - j * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
