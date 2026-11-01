import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApexErrorAlert({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "apex-error-alert flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
