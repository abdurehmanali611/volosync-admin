"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Loader2,
  Package,
  PackageMinus,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { ApexTenantTabShell } from "@/components/apex/tenant/ApexTenantTabShell";
import {
  excelImportsForTenant,
  type ExcelImportDefinition,
  type ExcelImportKind,
} from "@/constants/excelImport";
import { apexImportTenantExcel } from "@/lib/apex/excelImportActions";
import { mapApexApiError } from "@/lib/apex/api";
import type { TenantDetail } from "@/lib/apex/actions";
import {
  downloadExcelImportSample,
  parseExcelImportFile,
  validateExcelImportRows,
  type ExcelRowIssue,
} from "@/lib/apex/excelWorkbook";
import { cn } from "@/lib/utils";

type Props = {
  tenant: TenantDetail;
};

type PreviewState = {
  kind: ExcelImportKind;
  rowCount: number;
  issues: ExcelRowIssue[];
  rows: Record<string, unknown>[];
  fileName: string;
};

const KIND_META: Record<
  ExcelImportKind,
  {
    icon: LucideIcon;
    tone: "emerald" | "teal" | "amber";
    accent: string;
    iconClass: string;
  }
> = {
  item_registration: {
    icon: Package,
    tone: "emerald",
    accent: "apex-stat-topbar-emerald",
    iconClass:
      "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
  },
  stockout_request: {
    icon: PackageMinus,
    tone: "amber",
    accent: "apex-stat-topbar-amber",
    iconClass:
      "bg-[oklch(0.32_0.05_75)] text-[oklch(0.92_0.04_75)] ring-1 ring-[oklch(0.7_0.1_75/0.35)]",
  },
  sales_agent: {
    icon: Users,
    tone: "teal",
    accent: "apex-stat-topbar-teal",
    iconClass:
      "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.4)]",
  },
};

function isImportApiMissingError(msg: string): boolean {
  return /excel\/import|Not found\./i.test(msg);
}

function formatDummyCell(value: unknown): string {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value == null || value === "") return "—";
  return String(value);
}

function FormatPreviewTable({ def }: { def: ExcelImportDefinition }) {
  return (
    <div className="min-w-0 w-full space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2 px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.72_0.04_85)]">
          Format preview
        </p>
        <p className="text-[11px] text-muted-foreground">
          Example rows · replace with real data
        </p>
      </div>
      <div className="apex-table-wrap w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-white/8 bg-black/20 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
        <table className="w-max min-w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/4">
              {def.columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {col.label}
                  {col.required ? (
                    <span className="ml-0.5 text-[oklch(0.78_0.08_85)]">*</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {def.sampleRows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-white/5 last:border-0 hover:bg-white/3"
              >
                {def.columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-3 py-2 tabular-nums text-foreground/88"
                  >
                    {formatDummyCell(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportKpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tone: "gold" | "teal" | "emerald";
}) {
  const tones = {
    gold: {
      bar: "apex-stat-topbar-gold",
      icon: "bg-[oklch(0.32_0.05_85)] text-[oklch(0.9_0.05_85)] ring-1 ring-[oklch(0.7_0.08_85/0.35)]",
    },
    teal: {
      bar: "apex-stat-topbar-teal",
      icon: "bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.12_195/0.4)]",
    },
    emerald: {
      bar: "apex-stat-topbar-emerald",
      icon: "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
    },
  } as const;
  const t = tones[tone];

  return (
    <div className="apex-stat-card apex-panel-surface apex-stat-stagger overflow-hidden border-2">
      <div className={cn("h-1", t.bar)} />
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  );
}

export function ApexTenantExcelImport({ tenant }: Props) {
  const available = useMemo(
    () =>
      excelImportsForTenant({
        businessType: tenant.businessType,
        modules: tenant.modules,
      }),
    [tenant.businessType, tenant.modules],
  );

  const [busyKind, setBusyKind] = useState<ExcelImportKind | null>(null);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [importApiMissing, setImportApiMissing] = useState(false);
  const fileRefs = useRef<
    Partial<Record<ExcelImportKind, HTMLInputElement | null>>
  >({});

  const inventoryOn = tenant.modules.includes("Inventory");
  const salesOn = tenant.modules.includes("Sales Role");  const previewDef = preview
    ? available.find((d) => d.kind === preview.kind)
    : null;

  const onDownload = async (def: ExcelImportDefinition) => {
    setBusyKind(def.kind);
    try {
      await downloadExcelImportSample(def.kind, tenant.tinNumber);
      toast.success(`${def.title} format downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyKind(null);
    }
  };

  const onPickFile = (def: ExcelImportDefinition) => {
    fileRefs.current[def.kind]?.click();
  };

  const onFileChange = async (
    def: ExcelImportDefinition,
    file: File | null | undefined,
  ) => {
    if (!file) return;
    setBusyKind(def.kind);
    setPreview(null);
    setImportApiMissing(false);
    try {
      const parsed = await parseExcelImportFile(file, def);
      const validated = validateExcelImportRows(def, parsed.rows);
      setPreview({
        kind: def.kind,
        rowCount: parsed.rows.length,
        issues: validated.issues,
        rows: validated.rows,
        fileName: file.name,
      });
      if (validated.issues.length) {
        toast.error(
          `${validated.issues.length} issue${validated.issues.length === 1 ? "" : "s"} found — fix and re-upload`,
        );
      } else {
        toast.success(`${validated.rows.length} row(s) ready to import`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read Excel file");
    } finally {
      setBusyKind(null);
      const input = fileRefs.current[def.kind];
      if (input) input.value = "";
    }
  };

  const onImport = async () => {
    if (!preview || preview.issues.length > 0 || preview.rows.length === 0) {
      toast.error("Upload a valid Excel file first");
      return;
    }
    setBusyKind(preview.kind);
    setImportProgress({ done: 0, total: preview.rows.length });
    try {
      const result = await apexImportTenantExcel(
        {
          tinNumber: tenant.tinNumber,
          kind: preview.kind,
          rows: preview.rows,
        },
        {
          onProgress: (done, total) => setImportProgress({ done, total }),
        },
      );
      const errCount = result.errors?.length ?? 0;
      if (result.importedCount > 0) {
        toast.success(
          result.message ||
            `Imported ${result.importedCount} row(s)${result.skippedCount ? `, skipped ${result.skippedCount}` : ""}`,
        );
      }
      if (errCount > 0) {
        setPreview((prev) =>
          prev
            ? {
                ...prev,
                issues: result.errors.map((e) => ({
                  row: e.row,
                  message: e.message,
                })),
              }
            : prev,
        );
        toast.error(`${errCount} row(s) failed on import`);
      } else if (result.importedCount > 0) {
        setPreview(null);
      }
    } catch (e) {
      const msg = mapApexApiError(e, "Import failed");
      if (isImportApiMissingError(msg)) {
        setImportApiMissing(true);
        toast.error(
          "The Excel import endpoint is not deployed on the Django backend yet. Your file is validated and ready — redeploy the backend to write rows.",
        );
      } else if (msg) {
        toast.error(msg);
      }
    } finally {
      setBusyKind(null);
      setImportProgress(null);
    }
  };

  return (
    <ApexTenantTabShell
      title="Excel import"
      description="Bootstrap inventory records from a filled spreadsheet — skip one-by-one entry when a wholesaler joins with existing data."
      icon={FileSpreadsheet}
      tone="emerald"
      contentClassName="min-w-0 overflow-x-hidden"
      actions={
        <Badge variant="outline" className="tabular-nums">
          {available.length} ready
        </Badge>
      }
    >
      <div className="min-w-0 space-y-6">
        {/* Atmosphere strip */}
        <div className="apex-panel-surface relative overflow-hidden rounded-2xl border border-white/8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 -top-16 h-44 w-44 rounded-full bg-[oklch(0.5_0.08_155/0.16)] blur-3xl" />
            <div className="absolute -right-8 top-2 h-40 w-40 rounded-full bg-[oklch(0.55_0.06_85/0.12)] blur-3xl" />
          </div>
          <div className="relative h-1 bg-linear-to-r from-[oklch(0.62_0.12_155)] via-[oklch(0.72_0.08_85)] to-[oklch(0.62_0.1_195)]" />
          <div className="relative space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.75_0.04_85)]">
                  Onboarding seed
                </p>
                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  Prepare formats · collect data · import
                </h3>
                <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                  Download a template with dummy rows and an Allowed values
                  sheet. The wholesaler fills it in, then you upload here to seed
                  this TIN.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge variant="outline">{tenant.businessType || "—"}</Badge>
                <Badge variant={inventoryOn ? "success" : "warning"}>
                  {inventoryOn ? "Inventory on" : "Inventory off"}
                </Badge>
                <Badge variant={salesOn ? "success" : "warning"}>
                  {salesOn ? "Sales Role on" : "Sales Role off"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Download",
                  body: "Send the format file to the wholesaler.",
                },
                {
                  n: "02",
                  title: "Fill",
                  body: "They replace dummy rows using Allowed values.",
                },
                {
                  n: "03",
                  title: "Import",
                  body: "Upload the filled sheet and write records.",
                },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className="group relative flex gap-3 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3 backdrop-blur-sm"
                >
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-[oklch(0.78_0.06_85)]">
                    {step.n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                  {i < 2 ? (
                    <ArrowRight className="absolute -right-2 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 sm:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ImportKpi
            label="Subscribed modules"
            value={String(tenant.modules.length)}
            sub="Inventory and Sales Role gate formats"
            icon={ClipboardList}
            tone="gold"
          />
          <ImportKpi
            label="Formats unlocked"
            value={String(available.length)}
            sub={
              available.length
                ? "Ready to download and import"
                : "Enable a module to unlock"
            }
            icon={FileSpreadsheet}
            tone="emerald"
          />
          <ImportKpi
            label="Upload check"
            value={
              preview ? `${preview.rows.length}/${preview.rowCount}` : "Idle"
            }
            sub={
              preview
                ? preview.issues.length
                  ? `${preview.issues.length} issue(s)`
                  : preview.fileName
                : "No file loaded"
            }
            icon={Upload}
            tone="teal"
          />
        </div>

        {/* Row-by-row behaviour */}
        <div className="apex-info-banner flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.1_195/0.3)]">
            <ClipboardList className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              One row at a time
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              The Django backend checks every row on its own. A row that fails
              is reported and skipped; the rest of the file still imports.
              Registrations repeat-check by voucher, and stock outs never draft
              a lot beyond what is on hand.
            </p>
          </div>
        </div>

        {/* Formats */}
        {available.length === 0 ? (
          <div className="apex-panel-surface overflow-hidden rounded-2xl border border-white/8">
            <ApexEmptyState
              icon={FileSpreadsheet}
              title="No formats for this wholesaler"
              description="Enable Inventory or the Sales Role module on the Modules tab to unlock Excel seed formats."
            />
          </div>
        ) : (
          <div className="grid min-w-0 gap-4">
            {available.map((def, index) => {
              const meta = KIND_META[def.kind];
              const Icon = meta.icon;
              const isBusy = busyKind === def.kind;
              const isPreview = preview?.kind === def.kind;
              const requiredCount = def.columns.filter((c) => c.required).length;

              return (
                <div
                  key={def.kind}
                  className={cn(
                    "apex-stat-card apex-panel-surface min-w-0 overflow-hidden border-2 transition-all duration-200",
                    isPreview
                      ? "border-[oklch(0.62_0.12_155/0.45)] shadow-[0_0_0_1px_oklch(0.62_0.1_155/0.2)]"
                      : "border-white/8",
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className={cn("h-1", meta.accent)} />
                  <div className="space-y-5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            meta.iconClass,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold tracking-tight text-foreground">
                              {def.title}
                            </h4>
                            <Badge variant="outline" className="text-[10px]">
                              {def.requiredModule}
                            </Badge>
                            {isPreview ? (
                              <Badge
                                variant={
                                  preview && preview.issues.length === 0
                                    ? "success"
                                    : "warning"
                                }
                                className="text-[10px]"
                              >
                                {preview && preview.issues.length === 0
                                  ? "Ready"
                                  : "Needs fix"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-[13px] leading-relaxed text-muted-foreground">
                            {def.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Columns
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {requiredCount}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            required
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {def.sampleRows.length} sample rows
                        </p>
                      </div>
                    </div>

                    <FormatPreviewTable def={def} />

                    <div className="flex w-full min-w-0 items-center justify-between gap-3 border-t border-white/6 pt-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="apex-row-action gap-1.5"
                        disabled={!!busyKind}
                        onClick={() => void onDownload(def)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download format
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="apex"
                        className="apex-row-action gap-1.5"
                        disabled={!!busyKind}
                        onClick={() => onPickFile(def)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload filled file
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={(el) => {
                      fileRefs.current[def.kind] = el;
                    }}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) =>
                      void onFileChange(def, e.target.files?.[0])
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Upload check / import */}
        {preview ? (
          <div
            className={cn(
              "apex-panel-surface overflow-hidden rounded-2xl border-2",
              preview.issues.length
                ? "apex-error-alert border-[oklch(0.58_0.12_25/0.35)]"
                : "border-[oklch(0.62_0.12_155/0.4)]",
            )}
          >
            <div
              className={cn(
                "h-1",
                preview.issues.length
                  ? "apex-stat-topbar-danger"
                  : "apex-stat-topbar-emerald",
              )}
            />
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3.5">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      preview.issues.length
                        ? "bg-[oklch(0.32_0.06_25)] text-[oklch(0.92_0.04_25)] ring-1 ring-[oklch(0.65_0.14_25/0.4)]"
                        : "bg-[oklch(0.28_0.05_155)] text-[oklch(0.9_0.04_155)] ring-1 ring-[oklch(0.62_0.12_155/0.35)]",
                    )}
                  >
                    {preview.issues.length ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Upload check
                      {previewDef ? ` · ${previewDef.title}` : ""}
                    </p>
                    <p className="truncate text-base font-semibold tracking-tight text-foreground">
                      {preview.fileName}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {preview.rows.length} valid of {preview.rowCount} data
                      row(s)
                      {preview.issues.length
                        ? ` · ${preview.issues.length} issue(s)`
                        : " · ready to write"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="apex"
                  className="apex-row-action gap-1.5"
                  disabled={
                    !!busyKind ||
                    preview.issues.length > 0 ||
                    preview.rows.length === 0
                  }
                  onClick={() => void onImport()}
                >
                  {busyKind === preview.kind ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {busyKind === preview.kind && importProgress ? (
                    <>
                      Importing {importProgress.done}/{importProgress.total}
                      …
                    </>
                  ) : (
                    "Import into tenant"
                  )}
                </Button>
              </div>

              {importApiMissing ? (
                <div className="rounded-xl border border-[oklch(0.75_0.12_75/0.35)] bg-[oklch(0.55_0.05_75/0.12)] px-3.5 py-3">
                  <p className="text-sm font-semibold text-[oklch(0.92_0.04_75)]">
                    Import API not deployed
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    Upload validation succeeded ({preview.rows.length} rows).
                    Writing to the database needs the{" "}
                    <span className="font-mono text-xs text-foreground/90">
                      tenants/&lt;pk&gt;/excel/import/
                    </span>{" "}
                    endpoint on{" "}
                    <span className="font-medium text-foreground">
                      volosync-admin BackEnd
                    </span>
                    . Redeploy the Django backend, then click Import again.
                  </p>
                </div>
              ) : null}

              {preview.issues.length > 0 ? (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-white/8 bg-black/25 p-3.5 text-xs leading-relaxed">
                  {preview.issues.slice(0, 40).map((issue, i) => (
                    <li key={`${issue.row}-${i}`} className="text-foreground/90">
                      {issue.row > 0 ? (
                        <span className="font-mono text-[oklch(0.82_0.06_25)]">
                          Row {issue.row}
                        </span>
                      ) : null}
                      {issue.row > 0 ? " · " : ""}
                      {issue.message}
                    </li>
                  ))}
                  {preview.issues.length > 40 ? (
                    <li className="text-muted-foreground">
                      …and {preview.issues.length - 40} more
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3 text-[13px] text-muted-foreground">
                  Format matches. Import will seed these rows for{" "}
                  <span className="font-medium text-foreground">
                    {tenant.hotelDisplayName}
                  </span>
                  .
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ApexTenantTabShell>
  );
}
