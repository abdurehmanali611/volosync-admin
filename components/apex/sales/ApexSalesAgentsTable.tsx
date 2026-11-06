"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MapPin, PencilLine, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  deleteSalesAgent,
  setSalesAgentActive,
  upsertSalesAgent,
  type SalesAgentRow,
} from "@/lib/apex/actions";

type Props = {
  agents: SalesAgentRow[];
  onChanged: () => void;
};

type EditorState = {
  id?: number;
  displayName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  isActive: boolean;
};

function emptyEditor(): EditorState {
  return {
    displayName: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
    isActive: true,
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function SalesAgentStatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70" />
      Inactive
    </span>
  );
}

export function ApexSalesAgentsTable({ agents, onChanged }: Props) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const toggleActive = async (row: SalesAgentRow) => {
    setBusyId(row.id);
    try {
      await setSalesAgentActive(row.id, !row.isActive);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const removeAgent = async (row: SalesAgentRow) => {
    setBusyId(row.id);
    try {
      await deleteSalesAgent(row.id);
      toast.success("Sales agent deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (row: SalesAgentRow) =>
    setEditor({
      id: row.id,
      displayName: row.displayName,
      phone: row.phone ?? "",
      email: row.email ?? "",
      city: row.city ?? "",
      notes: row.notes ?? "",
      isActive: row.isActive,
    });

  const columns = useMemo<ColumnDef<SalesAgentRow>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Agent",
        cell: ({ row }) => {
          const agent = row.original;
          const contact = [agent.phone?.trim(), agent.email?.trim()]
            .filter(Boolean)
            .join(" · ");
          return (
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                  agent.isActive
                    ? "bg-linear-to-br from-[var(--apex-teal)] to-[var(--apex-gold)] text-[oklch(0.2_0.04_195)] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_8px_18px_-12px_oklch(0.55_0.1_195/0.8)]"
                    : "border border-white/10 bg-white/5 text-muted-foreground",
                )}
              >
                {initials(agent.displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {agent.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {contact || "No contact on file"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "city",
        header: "Coverage",
        cell: ({ row }) => {
          const city = row.original.city?.trim();
          return city ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--apex-gold)]/30 bg-[var(--apex-gold)]/10 px-2.5 py-1 text-xs font-medium text-[var(--apex-gold)]">
              <MapPin className="h-3 w-3" />
              {city}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/60">—</span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <SalesAgentStatusPill isActive={row.original.isActive} />,
      },
      {
        accessorKey: "tenantCount",
        header: "Wholesalers",
        cell: ({ row }) =>
          row.original.tenantCount > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-foreground">
              <Users className="h-3.5 w-3.5 text-[var(--apex-teal)]" />
              <span className="tabular-nums">{row.original.tenantCount}</span>
              <span className="font-normal text-muted-foreground">
                {row.original.tenantCount === 1 ? "account" : "accounts"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/2 px-2.5 py-1.5 text-xs text-muted-foreground/70">
              <Users className="h-3.5 w-3.5" />
              Unassigned
            </span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 cursor-pointer rounded-lg px-3 text-xs"
              disabled={busyId === row.original.id}
              onClick={() => void toggleActive(row.original)}
            >
              {row.original.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 cursor-pointer rounded-lg"
              onClick={() => openEdit(row.original)}
            >
              <PencilLine className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 cursor-pointer rounded-lg text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                  disabled={busyId === row.original.id}
                  aria-label={`Delete ${row.original.displayName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete sales agent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removes{" "}
                    <span className="font-medium text-foreground">
                      {row.original.displayName}
                    </span>{" "}
                    from the field team.{" "}
                    {row.original.tenantCount > 0
                      ? `The ${row.original.tenantCount} wholesaler${row.original.tenantCount === 1 ? "" : "s"} on file keep their history but lose their agent.`
                      : "This agent is not assigned to any wholesaler."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-xl font-semibold"
                    onClick={() => void removeAgent(row.original)}
                  >
                    Delete agent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [busyId],
  );

  const save = async () => {
    if (!editor) return;
    const name = editor.displayName.trim();
    setSaving(true);
    try {
      await upsertSalesAgent({
        id: editor.id,
        displayName: name,
        phone: editor.phone.trim() || null,
        email: editor.email.trim() || null,
        city: editor.city.trim() || null,
        notes: editor.notes.trim() || null,
        isActive: editor.isActive,
      });
      toast.success(editor.id ? "Sales agent updated" : "Sales agent added");
      setEditor(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = agents.filter((agent) => agent.isActive).length;
  const coveredTenants = agents.reduce((sum, agent) => sum + agent.tenantCount, 0);
  const nameMissing = !editor?.displayName.trim();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
            {activeCount} active
          </span>
          <span className="rounded-full border border-[var(--apex-gold)]/35 bg-[var(--apex-gold)]/10 px-3 py-1.5 text-xs font-medium text-[var(--apex-gold)]">
            {coveredTenants} wholesaler{coveredTenants === 1 ? "" : "s"} covered
          </span>
        </div>
        <Button
          variant="apex"
          className="h-10 shrink-0 cursor-pointer gap-2 self-start rounded-xl px-5 text-sm font-semibold shadow-[0_12px_28px_-16px_oklch(0.55_0.1_195/0.7)] ring-1 ring-[oklch(0.72_0.08_85/0.32)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_16px_32px_-14px_oklch(0.55_0.1_195/0.8)]"
          onClick={() => setEditor(emptyEditor())}
        >
          <Plus className="h-4 w-4" />
          Add sales agent
        </Button>
      </div>
      <div className="apex-panel-surface overflow-hidden rounded-2xl border border-white/8">
        <ApexDataTable
          columns={columns}
          data={agents}
          noun="sales agents"
          showToolbar
          searchPlaceholder="Search agents, cities, contacts…"
          rowClassName={(row) =>
            [
              "transition-all duration-150 active:scale-[0.998]",
              !row.isActive ? "opacity-55" : undefined,
            ]
              .filter(Boolean)
              .join(" ")
          }
          emptyState={
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Add the field team so signup and create-tenant can attribute deals.
            </p>
          }
        />
      </div>
      <Dialog open={editor != null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="gap-0 overflow-hidden border-border/60 p-0 sm:max-w-xl">
          <div className="h-1 w-full bg-linear-to-r from-[var(--apex-teal)] via-[var(--apex-gold)] to-[var(--apex-teal)]" />
          <DialogHeader className="border-b border-border/50 px-6 py-5 text-left">
            <DialogTitle>
              {editor?.id ? "Edit sales agent" : "New sales agent"}
            </DialogTitle>
            <DialogDescription>
              {editor?.id
                ? "Update the details on file. The name keeps its place on existing tenants."
                : "Only the name is required. The agent can be assigned to wholesalers right away."}
            </DialogDescription>
          </DialogHeader>
          {editor ? (
            <div className="max-h-[min(58vh,30rem)] min-h-0 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="sa-name">
                  Name <span className="text-[var(--apex-gold)]">*</span>
                </Label>
                <Input
                  id="sa-name"
                  autoFocus
                  placeholder="Full name as it should appear in Apex"
                  className="h-10"
                  value={editor.displayName}
                  onChange={(e) =>
                    setEditor({ ...editor, displayName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {nameMissing ? "Required — this is how the agent shows up everywhere." : "Shown on signups and create-tenant."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sa-phone">Phone</Label>
                  <PhoneInput
                    id="sa-phone"
                    defaultCountry="ET"
                    international
                    countryCallingCodeEditable
                    className="h-10 [&_button]:h-10 [&_input]:h-10"
                    value={editor.phone || undefined}
                    onChange={(v) =>
                      setEditor({ ...editor, phone: (v as string) || "" })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sa-email">Email</Label>
                  <Input
                    id="sa-email"
                    type="email"
                    placeholder="name@volosync.com"
                    className="h-10"
                    value={editor.email}
                    onChange={(e) =>
                      setEditor({ ...editor, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-city">City / coverage</Label>
                <Input
                  id="sa-city"
                  placeholder="Addis Ababa, Hawassa, …"
                  className="h-10"
                  value={editor.city}
                  onChange={(e) =>
                    setEditor({ ...editor, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-notes">Notes</Label>
                <Textarea
                  id="sa-notes"
                  rows={3}
                  className="min-h-24 resize-y leading-relaxed"
                  placeholder="Internal notes — territory, commission, etc."
                  value={editor.notes}
                  onChange={(e) =>
                    setEditor({ ...editor, notes: e.target.value })
                  }
                />
              </div>
              <div
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                  editor.isActive
                    ? "border-emerald-500/25 bg-emerald-500/8"
                    : "border-white/10 bg-white/3",
                )}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {editor.isActive ? "Active agent" : "Inactive agent"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inactive agents stay on old tenants but are hidden on new signups.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-[0.14em] uppercase",
                      editor.isActive ? "text-emerald-200" : "text-muted-foreground",
                    )}
                  >
                    {editor.isActive ? "On" : "Off"}
                  </span>
                  <Switch
                    aria-label="Active"
                    checked={editor.isActive}
                    onCheckedChange={(v) => setEditor({ ...editor, isActive: v })}
                    className={cn(
                      "border-white/25 transition-colors",
                      editor.isActive
                        ? "data-checked:border-emerald-400/60 data-checked:bg-emerald-500"
                        : "data-unchecked:bg-white/20 dark:data-unchecked:bg-white/20",
                    )}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border/50 bg-black/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer rounded-xl px-4 font-semibold"
              onClick={() => setEditor(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="apex"
              disabled={saving || nameMissing}
              className="h-10 cursor-pointer gap-2 rounded-xl px-5 text-sm font-semibold"
              onClick={() => void save()}
            >
              {saving ? "Saving…" : editor?.id ? "Save changes" : "Create sales agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
