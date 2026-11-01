import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ApexInfoBanner({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("apex-info-banner flex gap-3 text-sm leading-relaxed", className)}>
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--apex-teal)]" aria-hidden />
      ) : null}
      <div className="min-w-0 text-muted-foreground [&_span.font-mono]:rounded-md [&_span.font-mono]:bg-white/6 [&_span.font-mono]:px-1.5 [&_span.font-mono]:py-0.5 [&_span.font-mono]:text-foreground">
        {children}
      </div>
    </div>
  );
}
