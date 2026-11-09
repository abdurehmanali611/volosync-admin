"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { CloudinaryImageUploadButton } from "@/components/cloudinary/CloudinaryImageUploadButton";
import { Button } from "@/components/ui/button";
import {
  ApexTenantTabShell,
} from "@/components/apex/tenant/ApexTenantTabShell";
import type { TenantDetail } from "@/lib/apex/actions";
import { updateTenantLogo } from "@/lib/apex/actions";
import { toast } from "sonner";

export function ApexTenantLogoEditor({
  tenant,
  busy,
  onSaved,
  /** When set, the tab is read-only and always displays this logo — used by
   * satellite branches, whose logo is the main branch's and cannot change. */
  inheritedLogoUrl,
}: {
  tenant: TenantDetail;
  busy?: boolean;
  onSaved: () => void | Promise<void>;
  inheritedLogoUrl?: string | null;
}) {
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const locked = inheritedLogoUrl !== undefined;
  const current = locked
    ? (inheritedLogoUrl || "").trim()
    : (tenant.logoUrl || "").trim();
  const preview = (draftUrl || current || "").trim() || null;
  const dirty = !locked && Boolean(draftUrl && draftUrl.trim() !== current);

  const save = async () => {
    const url = (draftUrl || "").trim();
    if (!url) {
      toast.error("Upload a new logo first");
      return;
    }
    setSaving(true);
    try {
      await updateTenantLogo(tenant.tinNumber, url);
      toast.success("Logo updated");
      setDraftUrl(null);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update logo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApexTenantTabShell
      title="Wholesaler logo"
      description={
        locked
          ? "Satellite branches use the main branch's logo. It cannot be removed or changed here."
          : "Replace the logo shown across VoloSync for this wholesaler. Name, TIN, and business type stay unchanged."
      }
      icon={ImageIcon}
      tone="gold"
      actions={
        locked ? null : dirty ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || busy}
              onClick={() => setDraftUrl(null)}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="apex"
              size="sm"
              disabled={saving || busy}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save logo"}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={`${tenant.hotelDisplayName} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {locked ? (
            <p className="text-sm text-muted-foreground">
              This is the main branch&apos;s logo. To change it, open the Main
              tab and edit the logo there.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Upload a square PNG or JPEG. Changes apply after you save —
                wholesaler name, business type, and TIN are not edited here.
              </p>
              <CloudinaryImageUploadButton
                previewUrl={preview}
                onSuccess={(result) => {
                  setDraftUrl(result.info.secure_url);
                }}
              />
              {dirty ? (
                <p className="text-xs text-[oklch(0.85_0.06_85)]">
                  New logo ready — click Save logo to publish.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </ApexTenantTabShell>
  );
}
