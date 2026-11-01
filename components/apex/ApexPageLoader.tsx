import { Loader2 } from "lucide-react";
import { ApexLogo } from "@/components/apex/ApexLogo";
import { cn } from "@/lib/utils";

export function ApexPageLoader({
  label = "Loading…",
  className,
  fullScreen = false,
}: {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-muted-foreground",
        fullScreen ? "apex-canvas apex-loading-screen min-h-svh" : "min-h-[40vh]",
        className,
      )}
    >
      <div className="relative">
        <ApexLogo size={48} className="relative opacity-90" />
        <Loader2
          className="absolute -bottom-0.5 -right-0.5 h-5 w-5 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
