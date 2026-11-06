"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ApexApproveRejectActions({
  busy,
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  rejectTitle = "Reject submission",
  rejectDescription = "Provide a reason — the tenant will see this in their account.",
}: {
  busy?: boolean;
  onApprove: () => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
  rejectTitle?: string;
  rejectDescription?: string;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleReject = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setRejecting(true);
    try {
      await onReject(trimmed);
      setReason("");
      setOpen(false);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
      <Button
        size="sm"
        variant="success"
        className="apex-row-action shrink-0 gap-1.5"
        disabled={busy}
        onClick={() => void onApprove()}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {approveLabel}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="apex-row-action shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy}
          >
            <X className="h-3.5 w-3.5" />
            {rejectLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="apex-glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{rejectTitle}</AlertDialogTitle>
            <AlertDialogDescription>{rejectDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this submission is being rejected…"
            rows={3}
            className="resize-none bg-background/80"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!reason.trim() || rejecting}
              onClick={() => void handleReject()}
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm reject"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
