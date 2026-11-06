"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveModuleChangeRequest,
  rejectModuleChangeRequest,
} from "@/lib/apex/actions";

type Props = {
  requestId: number;
  status: string;
  onDone: () => void;
};

export function ApexModuleRequestActions({ requestId, status, onDone }: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (status !== "pending") return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      toast.success("Request updated");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 sm:min-w-[200px]">
      <Input
        placeholder="Review note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="success"
          className="apex-row-action"
          disabled={busy}
          onClick={() =>
            run(() => approveModuleChangeRequest(requestId, note.trim() || undefined))
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="apex-row-action"
          disabled={busy}
          onClick={() =>
            run(() => rejectModuleChangeRequest(requestId, note.trim() || undefined))
          }
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
