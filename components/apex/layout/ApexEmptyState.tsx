import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ApexEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="apex-empty-state flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <div className="apex-empty-icon">
        <Icon className="relative h-7 w-7 text-[oklch(0.82_0.04_85)]" />
      </div>
      <div className="max-w-md space-y-2">
        <p className="text-lg font-semibold tracking-tight text-foreground">{title}</p>
        {description ? (
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
