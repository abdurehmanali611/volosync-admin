import type {
  ExcelImportDefinition,
  ExcelImportKind,
} from "@/constants/excelImport";
import { getExcelImportDefinition } from "@/constants/excelImport";

async function loadXlsx() {
  const xlsxModule = await import("xlsx");
  return xlsxModule.default ?? xlsxModule;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sampleCellValue(value: unknown): string | number {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value == null) return "";
  if (typeof value === "number") return value;
  return String(value);
}

/**
 * Sample workbook tenants fill in:
 * - data sheet: short tip + headers + dummy rows to replace
 * - Allowed values sheet: exact choices for selector columns
 * - Instructions sheet: step-by-step plus the Django template notes
 */
export async function downloadExcelImportSample(
  kind: ExcelImportKind,
  tinNumber?: string,
): Promise<void> {
  const def = getExcelImportDefinition(kind);
  const XLSX = await loadXlsx();
  const wb = XLSX.utils.book_new();

  const header = def.columns.map((c) => c.label);
  const dataRows = def.sampleRows.map((row) =>
    def.columns.map((col) => sampleCellValue(row[col.key])),
  );
  const optionCols = def.columns.filter((c) => c.options && c.options.length);
  const selectNames = optionCols.map((c) => c.label).join(", ");

  const tipRow = [
    optionCols.length
      ? `Keep the column titles. Replace example rows with your real data. For ${selectNames}, open the "Allowed values" sheet and copy an exact spelling. Dates: YYYY-MM-DD. Yes/No: TRUE or FALSE.`
      : "Keep the column titles. Replace example rows with your real data. Dates: YYYY-MM-DD. Yes/No: TRUE or FALSE.",
  ];

  const dataSheet = XLSX.utils.aoa_to_sheet([tipRow, header, ...dataRows]);
  dataSheet["!cols"] = def.columns.map((c) => ({
    wch: Math.min(36, Math.max(14, c.label.length + 2)),
  }));
  // Merge tip across columns so it reads as one banner.
  if (def.columns.length > 1) {
    dataSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: def.columns.length - 1 } },
    ];
  }
  XLSX.utils.book_append_sheet(wb, dataSheet, def.sheetName);

  if (optionCols.length) {
    const maxLen = Math.max(...optionCols.map((c) => c.options!.length));
    const allowedAoa: (string | number)[][] = [
      ["ALLOWED VALUES — use these exact spellings in the data sheet"],
      [
        "Do not invent new words. Copy/paste from this sheet into the matching column. Empty cells below a column just mean that column has fewer options.",
      ],
      [],
      optionCols.map((c) => c.label),
    ];
    for (let i = 0; i < maxLen; i++) {
      allowedAoa.push(optionCols.map((c) => c.options![i] ?? ""));
    }
    allowedAoa.push([]);
    allowedAoa.push([
      "Also remember: dates = YYYY-MM-DD (example 2026-03-15). Yes/No columns use TRUE or FALSE.",
    ]);

    const listSheet = XLSX.utils.aoa_to_sheet(allowedAoa);
    listSheet["!cols"] = optionCols.map((c) => ({
      wch: Math.min(32, Math.max(16, c.label.length + 4)),
    }));
    listSheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, optionCols.length - 1) } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, optionCols.length - 1) } },
    ];
    XLSX.utils.book_append_sheet(wb, listSheet, "Allowed values");
  }

  const readMe = [
    ["Instructions for filling this VoloSync import file"],
    [],
    ...(tinNumber ? [["Wholesaler TIN", tinNumber]] : []),
    ["Template", def.title],
    [],
    ["Step 1", `Open the "${def.sheetName}" sheet.`],
    [
      "Step 2",
      "Keep the column title row exactly as it is. Do not rename or delete columns.",
    ],
    [
      "Step 3",
      "Delete or overwrite the example (dummy) rows with your real records. Add more rows if you need them.",
    ],
    [
      "Step 4",
      optionCols.length
        ? `Open the "Allowed values" sheet. For columns like ${selectNames}, copy one of the listed values exactly.`
        : "Fill each column with your real values.",
    ],
    ["Step 5", "Dates must look like 2026-03-15. Yes/No fields use TRUE or FALSE."],
    ["Step 6", "Save the file and send it back to Apex to import."],
    [],
    ...(def.notes.length
      ? [["Good to know"], ...def.notes.map((note) => [note]), []]
      : []),
    ["Column guide"],
    ["Column", "Required?", "Notes"],
    ...def.columns.map((c) => [
      c.label,
      c.required ? "Yes" : "No",
      c.options?.length
        ? `Choose from "Allowed values" sheet: ${c.options.join(", ")}`
        : (c.hint ?? ""),
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(readMe),
    "Instructions",
  );

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as number[];
  const blob = new Blob([new Uint8Array(out)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const suffix = tinNumber ? `-${tinNumber}` : "";
  downloadBlob(blob, `${def.fileBase}${suffix}.xlsx`);
}

export type ParsedExcelSheet = {
  sheetName: string;
  rows: Record<string, unknown>[];
  /** 1-based Excel row number of the header (for error messages). */
  headerRowNumber: number;
};

export async function parseExcelImportFile(
  file: File,
  def: ExcelImportDefinition,
): Promise<ParsedExcelSheet> {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  const skipSheets = new Set([
    "read_me",
    "instructions",
    "readme",
    "allowed_values",
    "allowed values",
  ]);
  const preferred =
    wb.SheetNames.find(
      (n) => n.toLowerCase() === def.sheetName.toLowerCase(),
    ) ??
    wb.SheetNames.find((n) => !skipSheets.has(n.toLowerCase().trim())) ??
    wb.SheetNames[0];

  if (!preferred) {
    throw new Error("Workbook has no sheets");
  }

  const sheet = wb.Sheets[preferred];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date)[]>(
    sheet,
    {
      header: 1,
      defval: "",
      raw: false,
    },
  );

  const labelSet = new Set(def.columns.map((c) => c.label.toLowerCase()));
  const keySet = new Set(def.columns.map((c) => c.key.toLowerCase()));

  let headerIdx = matrix.findIndex((row) => {
    const cells = row.map((c) => String(c ?? "").trim().toLowerCase()).filter(Boolean);
    if (cells.length < 2) return false;
    const hits = cells.filter((c) => labelSet.has(c) || keySet.has(c)).length;
    return hits >= Math.min(2, def.columns.length);
  });

  if (headerIdx < 0) {
    // Fallback: first non-empty row (legacy templates without tip banner).
    headerIdx = matrix.findIndex((row) =>
      row.some((c) => String(c ?? "").trim() !== ""),
    );
  }

  if (headerIdx < 0) {
    return { sheetName: preferred, rows: [], headerRowNumber: 1 };
  }

  const headers = matrix[headerIdx].map((c) => String(c ?? "").trim());
  const rows: Record<string, unknown>[] = [];

  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const obj: Record<string, unknown> = {};
    let any = false;
    headers.forEach((h, i) => {
      if (!h) return;
      const v = line[i] ?? "";
      if (String(v).trim() !== "") any = true;
      obj[h] = v;
    });
    if (any) {
      obj.__excelRow = r + 1; // 1-based sheet row
      rows.push(obj);
    }
  }

  return {
    sheetName: preferred,
    rows,
    headerRowNumber: headerIdx + 1,
  };
}

function resolveRawColumnValue(
  raw: Record<string, unknown>,
  col: { key: string; label: string },
): unknown {
  if (raw[col.key] != null && String(raw[col.key]).trim() !== "") {
    return raw[col.key];
  }
  if (raw[col.label] != null && String(raw[col.label]).trim() !== "") {
    return raw[col.label];
  }
  const wanted = new Set([
    col.key.toLowerCase(),
    col.label.toLowerCase(),
  ]);
  for (const [k, v] of Object.entries(raw)) {
    if (wanted.has(k.trim().toLowerCase())) return v;
  }
  return raw[col.key] ?? raw[col.label] ?? "";
}

function cellString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function cellNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function cellBool(value: unknown): boolean | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["true", "yes", "1", "y"].includes(s)) return true;
  if (["false", "no", "0", "n"].includes(s)) return false;
  return undefined;
}

export type ExcelRowIssue = {
  row: number;
  message: string;
};

export type NormalizedImportRow = Record<string, unknown>;

export type ExcelValidateResult = {
  ok: boolean;
  rows: NormalizedImportRow[];
  issues: ExcelRowIssue[];
};

/** Normalize + validate sheet rows against a template definition. */
export function validateExcelImportRows(
  def: ExcelImportDefinition,
  rawRows: Record<string, unknown>[],
): ExcelValidateResult {
  const issues: ExcelRowIssue[] = [];
  const rows: NormalizedImportRow[] = [];

  if (rawRows.length === 0) {
    return {
      ok: false,
      rows: [],
      issues: [{ row: 0, message: "No data rows found in the workbook" }],
    };
  }

  rawRows.forEach((raw, index) => {
    const excelRow =
      typeof raw.__excelRow === "number" ? raw.__excelRow : index + 2;
    const normalized: NormalizedImportRow = {};
    let rowFailed = false;

    for (const col of def.columns) {
      const rawVal = resolveRawColumnValue(raw, col);
      const asText = cellString(rawVal);

      if (col.required && !asText) {
        issues.push({
          row: excelRow,
          message: `Missing required column "${col.label}"`,
        });
        rowFailed = true;
        continue;
      }

      if (col.type === "date") {
        if (!asText) continue;
        const d = new Date(asText);
        if (Number.isNaN(d.getTime())) {
          issues.push({
            row: excelRow,
            message: `Invalid date for "${col.label}" (use YYYY-MM-DD)`,
          });
          rowFailed = true;
        } else {
          normalized[col.key] = asText.slice(0, 10);
        }
        continue;
      }

      if (col.type === "number" || col.type === "money" || col.type === "int") {
        if (!asText) continue;
        const n = cellNumber(rawVal);
        if (n == null) {
          issues.push({
            row: excelRow,
            message: `"${col.label}" must be a number`,
          });
          rowFailed = true;
        } else {
          normalized[col.key] = col.type === "int" ? Math.round(n) : n;
        }
        continue;
      }

      if (col.type === "bool") {
        if (!asText) continue;
        const b = cellBool(rawVal);
        if (b === undefined) {
          issues.push({
            row: excelRow,
            message: `"${col.label}" must be TRUE or FALSE`,
          });
          rowFailed = true;
        } else {
          normalized[col.key] = b;
        }
        continue;
      }

      if (col.options?.length) {
        if (!asText) continue;
        const wanted = asText.toLowerCase();
        const matchIdx = col.options.findIndex(
          (option) => option.toLowerCase() === wanted,
        );
        if (matchIdx < 0) {
          issues.push({
            row: excelRow,
            message: `"${col.label}" must be one of: ${col.options.join(", ")}`,
          });
          rowFailed = true;
        } else {
          normalized[col.key] = col.options[matchIdx];
        }
        continue;
      }

      if (asText) normalized[col.key] = asText;
    }

    if (def.kind === "stockout_request") {
      const hasLot = Boolean(
        cellString(normalized.voucher_number) ||
          cellString(normalized.item_name),
      );
      if (!hasLot) {
        issues.push({
          row: excelRow,
          message: "Fill either the lot voucher or the item name",
        });
        rowFailed = true;
      }
    }

    if (!rowFailed) rows.push(normalized);
  });

  return { ok: issues.length === 0, rows, issues };
}
