"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  broadcastApexChatToTenants,
  fetchTenants,
} from "@/lib/apex/actions";
import { mapApexApiError } from "@/lib/apex/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApexTenantMultiPropertyPicker } from "@/components/apex/feedback/ApexTenantMultiPropertyPicker";

type Props = {
  onDone?: () => void;
};

export function ApexBroadcastChatDialog({ onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tins, setTins] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<
    { tinNumber: string; hotelDisplayName: string }[]
  >([]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoadingTenants(true);
      try {
        const list = await fetchTenants();
        setOptions(
          list
            .filter(
              (t) =>
                String(t.accountStatus || "").toLowerCase() === "active",
            )
            .map((t) => ({
              tinNumber: t.tinNumber,
              hotelDisplayName: t.hotelDisplayName,
            }))
            .sort((a, b) =>
              a.hotelDisplayName.localeCompare(b.hotelDisplayName),
            ),
        );
      } catch (e) {
        toast.error(mapApexApiError(e, "Could not load wholesalers"));
      } finally {
        setLoadingTenants(false);
      }
    })();
  }, [open]);

  const canSubmit =
    tins.length > 0 && Boolean(message.trim()) && !submitting && !loadingTenants;

  const handleBroadcast = async () => {
    if (tins.length === 0) {
      toast.error("Select at least one wholesaler");
      return;
    }
    if (!message.trim()) {
      toast.error("Enter a broadcast message");
      return;
    }
    setSubmitting(true);
    try {
      const result = await broadcastApexChatToTenants(tins, message.trim());
      if (result.sentCount > 0 && result.failedCount === 0) {
        toast.success(
          `Broadcast sent to ${result.sentCount} propert${result.sentCount === 1 ? "y" : "ies"}`,
        );
      } else if (result.sentCount > 0) {
        toast.warning(
          `Sent to ${result.sentCount}, failed for ${result.failedCount}`,
        );
      } else {
        toast.error(
          result.failures[0]?.message || "Broadcast failed for all wholesalers",
        );
      }
      setOpen(false);
      setTins([]);
      setMessage("");
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTins([]);
          setMessage("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Megaphone className="h-4 w-4" />
          Broadcast
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Broadcast to wholesalers</DialogTitle>
          <DialogDescription>
            Select the tenants that should receive this message. Each selected
            wholesaler gets its own chat thread with the same opening message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="apex-broadcast-wholesalers">
              Wholesalers <span className="text-destructive">*</span>
            </Label>
            <ApexTenantMultiPropertyPicker
              id="apex-broadcast-wholesalers"
              options={options}
              value={tins}
              onValueChange={setTins}
              loading={loadingTenants}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Only active tenants appear here. Max 50 per broadcast.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apex-broadcast-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="apex-broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement for selected wholesalers…"
              rows={4}
              disabled={submitting}
              className="w-full resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="apex"
            size="lg"
            className="w-full sm:w-auto"
            disabled={!canSubmit}
            onClick={() => void handleBroadcast()}
          >
            {submitting
              ? "Sending…"
              : tins.length > 0
                ? `Send to ${tins.length}`
                : "Send broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
