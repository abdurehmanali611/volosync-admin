"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton } from "@/components/ui/pending-button";
import { mapApiError } from "@/lib/admin/core";

/** Approve / reject a pending queue row, with an optional decision note. */
export function ApexDecisionActions({
  what,
  onDecide,
}: {
  what: string;
  onDecide: (
    decision: "APPROVED" | "REJECTED",
    note: string,
  ) => Promise<unknown>;
}) {
  const [open, setOpen] = React.useState<null | "APPROVED" | "REJECTED">(null);
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const close = () => {
    setOpen(null);
    setNote("");
  };

  const run = async () => {
    if (!open) return;
    setPending(true);
    try {
      await onDecide(open, note.trim());
      toast.success(
        open === "APPROVED" ? `${what} approved` : `${what} rejected`,
      );
      close();
    } catch (e) {
      toast.error(
        mapApiError(e, `Could not update this ${what.toLowerCase()}.`),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen("APPROVED")}
          className="h-8 cursor-pointer border-apex-emerald/30 text-apex-emerald hover:bg-apex-emerald/10"
        >
          <Check className="mr-1 size-3.5" /> Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen("REJECTED")}
          className="h-8 cursor-pointer text-muted-foreground hover:bg-apex-danger/10 hover:text-apex-danger"
        >
          <X className="mr-1 size-3.5" /> Reject
        </Button>
      </div>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => (next ? null : close())}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {open === "APPROVED"
                ? `Approve ${what.toLowerCase()}`
                : `Reject ${what.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {open === "APPROVED"
                ? "This is recorded in the audit log and takes effect immediately."
                : "The decision is recorded; the request itself is not applied."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">Note (optional)</Label>
            <Input
              id="decision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Verified against the bank statement"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={close} className="cursor-pointer">
              Cancel
            </Button>
            <PendingButton
              pending={pending}
              onClick={run}
              className={
                open === "APPROVED"
                  ? "cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
                  : "cursor-pointer bg-apex-danger font-semibold text-white hover:brightness-110"
              }
            >
              Confirm
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
