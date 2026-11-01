"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mapApiError } from "@/lib/admin/core";
import {
  IMAGE_ACCEPT,
  uploadImage,
  validateImageFile,
} from "@/lib/admin/uploads";

/**
 * Logo picker for tenant branding.
 *
 * The chosen file uploads straight to Cloudinary (unsigned preset from
 * `.env.local`) while a local blob preview shows instantly; the resulting
 * `secure_url` is handed back to the parent form.
 */
export function ApexLogoUpload({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  // Blob preview while uploading; the committed `value` always wins once set.
  const [preview, setPreview] = React.useState<string | null>(null);
  const shown = value || preview;

  const pick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      setPreview(null);
      toast.success("Logo uploaded");
    } catch (e) {
      const message = mapApiError(e, "Could not upload this image.");
      if (message) toast.error(message);
      setPreview(null);
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void onFile(e)}
      />

      <div
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/60",
          value && "border-apex-emerald/35",
        )}
      >
        {shown ? (
          <Image
            src={shown}
            alt="Tenant logo preview"
            width={64}
            height={64}
            unoptimized
            className="size-full object-contain"
          />
        ) : uploading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
        {uploading && preview ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pick}
            disabled={disabled || uploading}
            className="cursor-pointer gap-1.5 border-border/60 bg-background/80"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : value ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            {uploading ? "Uploading…" : value ? "Change logo" : "Upload logo"}
          </Button>
          {value && !uploading ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreview(null);
                onChange("");
              }}
              disabled={disabled}
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {uploading
            ? "Uploading to Cloudinary…"
            : value
            ? "Logo ready — shown across the tenant's workspace."
            : "PNG, JPG or WEBP · up to 5 MB. Optional."}
        </p>
      </div>
    </div>
  );
}
