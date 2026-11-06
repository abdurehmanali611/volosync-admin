import Image from "next/image";
import { cn } from "@/lib/utils";

export const APEX_LOGO_SRC = "/assets/apex-icon-amber.png";

export function ApexLogo({
  size = 48,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={APEX_LOGO_SRC}
      alt="Apex Solution"
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}

/** Logo in a soft amber glow — sidebar footer & top bar (replaces initials avatar). */
export function ApexLogoMark({
  size = 40,
  className,
  glowClassName,
}: {
  size?: number;
  className?: string;
  glowClassName?: string;
}) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full bg-[oklch(0.5_0.04_85/0.12)] blur-sm",
          glowClassName,
        )}
        aria-hidden
      />
      <ApexLogo
        size={size}
        className="relative rounded-full ring-1 ring-white/10"
      />
    </div>
  );
}
