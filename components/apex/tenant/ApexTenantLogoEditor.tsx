"use client";

import { useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { CloudinaryImageUploadButton } from "@/components/cloudinary/CloudinaryImageUploadButton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  /** Set only while the company detail is still loading for a branch page;
   * once loaded the editor targets the company logo directly. */
  inheritedLogoUrl,
  lockedReason,
  scopeNote,
  scopeTins,
}: {
  tenant: TenantDetail;
  busy?: boolean;
  onSaved: () => void | Promise<void>;
  inheritedLogoUrl?: string | null;
  lockedReason?: string;
  scopeNote?: string;
  /** Every branch of the family; a logo change lands on all of them so no
   * two branches ever carry different logos. */
  scopeTins?: string[];
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
      await Promise.all(
        (scopeTins ?? [tenant.tinNumber]).map((tin) => updateTenantLogo(tin, url)),
      );
      toast.success("Logo updated");
      setDraftUrl(null);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update logo");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await Promise.all(
        (scopeTins ?? [tenant.tinNumber]).map((tin) => updateTenantLogo(tin, "")),
      );
      toast.success("Logo removed");
      setDraftUrl(null);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove logo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApexTenantTabShell
      title="Wholesaler logo"
      description={
        locked
          ? (lockedReason ?? "Loading the company logo…")
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
        ) : current ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || busy}
                className="cursor-pointer gap-1.5 text-[oklch(0.72_0.17_25)] hover:bg-[oklch(0.62_0.2_25/0.12)] hover:text-[oklch(0.78_0.17_25)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove logo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this logo?</AlertDialogTitle>
                <AlertDialogDescription>
                  {tenant.hotelDisplayName} will fall back to the default
                  placeholder across VoloSync. You can upload a new logo at any
                  time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Keep logo</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="rounded-xl font-semibold"
                  onSelect={(e) => {
                    e.preventDefault();
                    void remove();
                  }}
                >
                  {saving ? "Removing…" : "Remove logo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null
      }
    >
      <div className="space-y-5">
        {scopeNote ? (
          <p className="rounded-xl border border-[oklch(0.75_0.08_85/0.25)] bg-[oklch(0.75_0.08_85/0.08)] px-3.5 py-2.5 text-xs leading-relaxed text-[oklch(0.88_0.06_85)]">
            {scopeNote}
          </p>
        ) : null}
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
              {lockedReason ??
                "The logo controls appear here once the company loads."}
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
      </div>
    </ApexTenantTabShell>
  );
}
