"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCirclePlus } from "lucide-react";
import { toast } from "sonner";
import { fetchTenants, startApexChatWithTenant } from "@/lib/apex/actions";
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
import { ApexTenantPropertyPicker } from "@/components/apex/feedback/ApexTenantPropertyPicker";

type Props = {
  defaultTin?: string;
  onDone?: () => void;
  trigger?: ReactNode;
};

export function ApexStartChatDialog({ defaultTin, onDone, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tin, setTin] = useState(defaultTin ?? "");
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<
    { tinNumber: string; hotelDisplayName: string; isBranch?: boolean; isMain?: boolean; parentTin?: string | null }[]
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
              isBranch: t.isBranch,
              isMain: t.isMain,
              parentTin: t.parentTin ?? null,
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

  const canSubmit = Boolean(tin.trim()) && Boolean(message.trim()) && !submitting;

  const handleStart = async () => {
    if (!tin.trim()) {
      toast.error("Select a wholesaler");
      return;
    }
    if (!message.trim()) {
      toast.error("Enter an opening message");
      return;
    }
    setSubmitting(true);
    try {
      const thread = await startApexChatWithTenant(tin.trim(), message.trim());
      toast.success("Chat opened");
      setOpen(false);
      setTin(defaultTin ?? "");
      setMessage("");
      onDone?.();
      router.push(`/feedback/${thread.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start chat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && defaultTin) setTin(defaultTin);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="apex" size="default" className="gap-2">
            <MessageCirclePlus className="h-4 w-4" />
            Start chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a wholesaler chat</DialogTitle>
          <DialogDescription>
            Pick a wholesaler and write your opening message — in any order. Both are required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="apex-chat-wholesaler">
              Wholesaler <span className="text-destructive">*</span>
            </Label>
            <ApexTenantPropertyPicker
              id="apex-chat-wholesaler"
              options={options}
              value={tin}
              onValueChange={setTin}
              loading={loadingTenants}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apex-chat-message">
              Opening message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="apex-chat-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi — we're checking in about your subscription…"
              rows={3}
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
            onClick={() => void handleStart()}
          >
            {submitting ? "Opening…" : "Open chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
