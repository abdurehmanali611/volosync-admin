"use client";

import * as React from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Handshake, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { ApexDataTable } from "@/components/apex/layout/ApexDataTable";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexInfoBanner } from "@/components/apex/layout/ApexInfoBanner";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import {
  ApexQueuePage,
  ApexQueueStats,
  useQueue,
} from "@/components/apex/platform/ApexQueuePage";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PendingButton } from "@/components/ui/pending-button";
import { mapApiError } from "@/lib/admin/core";
import {
  fetchSalesAgents,
  saveSalesAgent,
  type SalesAgent,
} from "@/lib/admin/platform";
import { dateLabel } from "@/components/apex/platform/ApexQueuePage";

type Draft = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  sex: string;
  active: boolean;
  notes: string;
};

const EMPTY: Draft = {
  name: "",
  phone: "",
  email: "",
  sex: "",
  active: true,
  notes: "",
};

export default function SalesAgentsPage() {
  const queue = useQueue(fetchSalesAgents);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Agent name is required.");
      return;
    }
    setSaving(true);
    try {
      await saveSalesAgent(draft, draft.id);
      toast.success(draft.id ? "Agent updated" : "Agent created");
      setDraft(null);
      queue.reload();
    } catch (e) {
      toast.error(mapApiError(e, "Could not save the agent."));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (agent: SalesAgent) => {
    try {
      await saveSalesAgent(
        { name: agent.name, active: !agent.active },
        agent.id,
      );
      toast.success(agent.active ? "Agent deactivated" : "Agent activated");
      queue.reload();
    } catch (e) {
      toast.error(mapApiError(e, "Could not update the agent."));
    }
  };

  const columns = React.useMemo<LegacyColumnDef<SalesAgent, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Agent",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Joined {dateLabel(row.original.created_at)}
            </p>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs text-muted-foreground">
            {row.original.phone ? (
              <p className="flex items-center gap-1.5">
                <Phone className="size-3" /> {row.original.phone}
              </p>
            ) : null}
            {row.original.email ? (
              <p className="flex items-center gap-1.5">
                <Mail className="size-3" /> {row.original.email}
              </p>
            ) : null}
            {!row.original.phone && !row.original.email ? "—" : null}
          </div>
        ),
      },
      {
        accessorKey: "sex",
        header: "Sex",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.sex || "—"}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[220px] text-sm text-muted-foreground">
            {row.original.notes || "—"}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Active",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={row.original.active}
              onCheckedChange={() => toggleActive(row.original)}
              aria-label={`Toggle ${row.original.name}`}
            />
            <Badge
              variant="outline"
              className={
                row.original.active
                  ? "border-transparent bg-apex-emerald/15 text-[10px] uppercase text-apex-emerald"
                  : "border-transparent bg-white/8 text-[10px] uppercase text-muted-foreground"
              }
            >
              {row.original.active ? "Active" : "Off"}
            </Badge>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() =>
              setDraft({
                id: row.original.id,
                name: row.original.name,
                phone: row.original.phone,
                email: row.original.email,
                sex: row.original.sex,
                active: row.original.active,
                notes: row.original.notes,
              })
            }
          >
            Edit
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const active = queue.rows.filter((r) => r.active).length;

  return (
    <ApexQueuePage
      title="Sales agents"
      description="Apex's own sellers — created here, then selected when onboarding a tenant."
      breadcrumbs={[
        { label: "Overview", href: "/dashboard" },
        { label: "Sales agents" },
      ]}
      actions={
        <Button
          variant="apex"
          size="sm"
          onClick={() => setDraft(EMPTY)}
          className="cursor-pointer"
        >
          <Handshake className="mr-2 size-4" /> New agent
        </Button>
      }
      loading={queue.loading}
      error={queue.error}
      columns={6}
    >
      <div className="space-y-4">
        <ApexInfoBanner icon={Handshake}>
          Only active agents appear in the tenant creation selector.
          Deactivating an agent keeps existing tenants attributed to them.
        </ApexInfoBanner>
        <ApexQueueStats
          items={[
            { label: "Agents", value: queue.rows.length, tone: "emerald" },
            { label: "Active", value: active, tone: "sky" },
            {
              label: "Inactive",
              value: queue.rows.length - active,
              tone: "amber",
            },
          ]}
        />
        <ApexPanel>
          {queue.rows.length === 0 ? (
            <ApexEmptyState
              icon={Handshake}
              title="No sales agents yet"
              description="Create the first agent to attribute new tenants to a seller."
              action={
                <Button
                  variant="apex"
                  onClick={() => setDraft(EMPTY)}
                  className="cursor-pointer"
                >
                  New agent
                </Button>
              }
            />
          ) : (
            <ApexDataTable
              data={queue.rows}
              columns={columns}
              noun="agents"
              pageSize={10}
              showToolbar={false}
            />
          )}
        </ApexPanel>
      </div>

      <Dialog
        open={draft !== null}
        onOpenChange={(next) => (next ? null : setDraft(null))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Edit agent" : "New sales agent"}
            </DialogTitle>
            <DialogDescription>
              Agents are the people who bring wholesalers onto VoloSync.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Hanna Tesfaye"
                  className="h-10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                    placeholder="+251911777888"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                    placeholder="hanna@apex.et"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sex</Label>
                  <Select
                    value={draft.sex || "none"}
                    onValueChange={(v) =>
                      setDraft({ ...draft, sex: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="M">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2.5">
                  <Label htmlFor="agent-active">Active</Label>
                  <Switch
                    id="agent-active"
                    checked={draft.active}
                    onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  placeholder="Territory, commission agreement, remarks"
                  rows={3}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDraft(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <PendingButton
              pending={saving}
              onClick={submit}
              className="cursor-pointer bg-linear-to-r from-apex-emerald to-apex-teal font-semibold text-white hover:brightness-110"
            >
              {draft?.id ? "Save agent" : "Create agent"}
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ApexQueuePage>
  );
}
