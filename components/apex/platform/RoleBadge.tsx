import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  APEX: "bg-apex-violet/15 text-[oklch(0.85_0.1_295)] ring-1 ring-apex-violet/30",
  OWNER: "bg-apex-emerald/15 text-apex-emerald ring-1 ring-apex-emerald/30",
  MANAGER: "bg-apex-teal/15 text-apex-teal ring-1 ring-apex-teal/30",
  FINANCE: "bg-apex-sky/15 text-apex-sky ring-1 ring-apex-sky/30",
  HR: "bg-apex-amber/15 text-apex-amber ring-1 ring-apex-amber/30",
  SALES:
    "bg-apex-violet/15 text-[oklch(0.85_0.1_295)] ring-1 ring-apex-violet/25",
  STORE: "bg-white/8 text-muted-foreground ring-1 ring-white/10",
};

export function RoleBadge({ role }: { role: string }) {
  const key = String(role || "").toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent text-[10px] font-semibold uppercase tracking-wide",
        ROLE_STYLES[key] ?? "bg-muted text-muted-foreground",
      )}
    >
      {key || "—"}
    </Badge>
  );
}
