import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ApexPanel({
  children,
  className,
  contentClassName,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  description?: string;
}) {
  const hasHeader = Boolean(title || description);

  return (
    <Card className={cn("apex-panel-surface min-w-0 overflow-hidden", className)}>
      {hasHeader ? (
        <CardHeader className="border-b border-white/6 px-4 py-4 sm:px-6">
          {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : null}
          {description ? (
            <CardDescription className="text-sm">{description}</CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

/** Wrap tables for consistent row hover and header styling. */
export function ApexTableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("apex-table-wrap overflow-x-auto", className)}>{children}</div>
  );
}
