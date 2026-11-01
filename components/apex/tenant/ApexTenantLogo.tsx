"use client";

import Image from "next/image";
import { Building2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tenant logo in a rounded tile — falls back to a building/branch glyph when
 * the tenant has no `logo_url` yet. `unoptimized` because Cloudinary already
 * delivers an optimised CDN image (and the host isn't in next.config).
 */
export function ApexTenantLogo({
  src,
  name,
  isBranch = false,
  size = 36,
  className,
}: {
  src?: string | null;
  name: string;
  isBranch?: boolean;
  size?: number;
  className?: string;
}) {
  const url = (src ?? "").trim();

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white/4",
        url ? "border-border/50" : "border-border/40",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={`${name} logo`}
          width={size}
          height={size}
          unoptimized
          className="size-full object-contain p-0.5"
        />
      ) : isBranch ? (
        <GitBranch className="size-4 text-muted-foreground" />
      ) : (
        <Building2 className="size-4 text-apex-emerald/80" />
      )}
    </span>
  );
}
