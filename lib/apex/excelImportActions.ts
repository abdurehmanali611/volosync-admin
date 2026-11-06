import { apexPost } from "./api";
import { resolveTenantId } from "./actions";
import type { ExcelImportKind } from "@/constants/excelImport";

export type ApexExcelImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string | null;
  errors: { row: number; message: string }[];
};

/** Django `POST /api/tenants/<pk>/excel/import/` success payload. */
type ExcelImportPayload = {
  kind: string;
  sheet: string;
  dry_run: boolean;
  tenant: string;
  rows: number;
  imported_count: number;
  skipped_count: number;
  documents?: { code?: string; label?: string }[];
  errors?: { row: number; message: string }[];
};

/**
 * Stock-out rows touch lots, vouchers and assignments, so they are much
 * heavier per write than the other importers. Keep chunks small so each
 * request finishes before the gateway 504.
 */
const IMPORT_CHUNK_SIZE: Record<ExcelImportKind, number> = {
  item_registration: 40,
  stockout_request: 8,
  sales_agent: 40,
};

/** Per-chunk client timeout (Vercel may still 504 earlier on free/pro limits). */
const IMPORT_CHUNK_TIMEOUT_MS = 90_000;

const MAX_CHUNK_RETRIES = 2;

function isRetryableImportError(error: unknown): boolean {
  const msg = String((error instanceof Error ? error.message : error) ?? "");
  return /timed out|timeout|504|502|503|ECONNABORTED|network/i.test(msg);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toImportResult(payload: ExcelImportPayload): ApexExcelImportResult {
  const importedCount = Number(payload.imported_count ?? 0);
  const errors = (payload.errors ?? []).map((err) => ({
    row: Number(err.row ?? 0),
    message: String(err.message ?? ""),
  }));
  const skippedCount = Number(payload.skipped_count ?? errors.length);
  const total = Number(payload.rows ?? importedCount + skippedCount);
  const voucherNote = payload.documents?.length
    ? ` · ${payload.documents.length} voucher(s)`
    : "";
  return {
    importedCount,
    skippedCount,
    message: `${importedCount} of ${total} row(s) imported${voucherNote}.`,
    errors,
  };
}

async function apexImportTenantExcelChunk(input: {
  tenantId: number;
  kind: ExcelImportKind;
  rows: Record<string, unknown>[];
}): Promise<ApexExcelImportResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt += 1) {
    try {
      const payload = await apexPost<ExcelImportPayload>(
        `/api/tenants/${input.tenantId}/excel/import/`,
        { kind: input.kind, rows: input.rows, dry_run: false },
        { timeoutMs: IMPORT_CHUNK_TIMEOUT_MS },
      );
      return toImportResult(payload);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_CHUNK_RETRIES && isRetryableImportError(error)) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Apex-admin bulk seed via `POST /api/tenants/<pk>/excel/import/`.
 * Rows are JSON matching the sample template column keys for `kind`.
 * Imports are written as ready-to-use / authorized records so onboarding
 * can skip the normal multi-step approval path.
 */
export async function apexImportTenantExcel(
  input: {
    tinNumber: string;
    kind: ExcelImportKind;
    rows: Record<string, unknown>[];
  },
  options?: {
    onProgress?: (imported: number, total: number) => void;
  },
): Promise<ApexExcelImportResult> {
  const { kind, rows } = input;
  const tenantId = await resolveTenantId(input.tinNumber);
  const total = rows.length;
  const chunkSize = IMPORT_CHUNK_SIZE[kind] ?? 25;

  if (total <= chunkSize) {
    const result = await apexImportTenantExcelChunk({ tenantId, kind, rows });
    options?.onProgress?.(
      result.importedCount + (result.errors?.length ?? 0),
      total,
    );
    return result;
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; message: string }[] = [];

  for (let start = 0; start < total; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const result = await apexImportTenantExcelChunk({
      tenantId,
      kind,
      rows: chunk,
    });

    importedCount += result.importedCount;
    skippedCount += result.skippedCount;
    for (const err of result.errors ?? []) {
      errors.push({
        row: start + err.row,
        message: err.message,
      });
    }
    options?.onProgress?.(Math.min(start + chunk.length, total), total);
  }

  const batchCount = Math.ceil(total / chunkSize);
  const message =
    errors.length === 0
      ? `Imported ${importedCount} row(s) in ${batchCount} batch(es).`
      : `Imported ${importedCount} of ${total} row(s); ${errors.length} failed.`;

  return {
    importedCount,
    skippedCount,
    message,
    errors,
  };
}
