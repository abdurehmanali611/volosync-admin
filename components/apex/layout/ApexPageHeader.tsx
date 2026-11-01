import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

export function ApexPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("apex-page-header space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-50" /> : null}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="rounded-md px-1 py-0.5 transition-colors hover:bg-white/5 hover:text-primary"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground/75">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Apex console
            </p>
            <h1 className="apex-gradient-text text-2xl tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
