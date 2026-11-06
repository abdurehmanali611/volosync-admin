/**
 * Excel onboarding templates for Apex → wholesaler seed imports.
 * Kinds, column keys, headers, types and samples mirror the Django
 * KINDS spec in BackEnd/tenants/excel_views.py — keep them aligned.
 */

export type ExcelImportColumnType =
  | "text"
  | "number"
  | "money"
  | "int"
  | "date"
  | "bool"
  | "choice";

export type ExcelImportKind =
  | "item_registration"
  | "stockout_request"
  | "sales_agent";

export type ExcelImportColumn = {
  key: string;
  label: string;
  type: ExcelImportColumnType;
  required: boolean;
  default?: string;
  /** When set, the cell must be one of these exact values. */
  options?: readonly string[];
  hint?: string;
};

export type ExcelImportDefinition = {
  kind: ExcelImportKind;
  /** Same text the Django template puts on the sheet tab. */
  title: string;
  description: string;
  /** Subscription module that unlocks this importer. */
  requiredModule: "Inventory" | "Sales Role";
  sheetName: string;
  fileBase: string;
  columns: ExcelImportColumn[];
  sampleRows: Record<string, string | number | boolean>[];
  notes: string[];
};

export const EXCEL_IMPORT_DEFINITIONS: ExcelImportDefinition[] = [
  {
    kind: "item_registration",
    title: "Item registrations",
    description:
      "Purchases that become stock. Rows sharing one supplier are grouped into a single registration voucher.",
    requiredModule: "Inventory",
    sheetName: "Item registrations",
    fileBase: "volosync-item-registrations",
    columns: [
      { key: "item_name", label: "Item name", type: "text", required: true },
      {
        key: "category",
        label: "Category",
        type: "text",
        required: false,
        hint: "Blank groups the item on its own.",
      },
      {
        key: "unit",
        label: "Measured by",
        type: "text",
        required: false,
        default: "PCS",
        hint: "PCS, KG, LITRE, CARTON…",
      },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_cost", label: "Unit cost", type: "money", required: true },
      {
        key: "unit_sales",
        label: "Unit selling price",
        type: "money",
        required: true,
      },
      {
        key: "vat_rate",
        label: "VAT %",
        type: "number",
        required: false,
        default: "15.00",
      },
      {
        key: "registration_date",
        label: "Registration date",
        type: "date",
        required: true,
      },
      {
        key: "expiry_date",
        label: "Expiry date",
        type: "date",
        required: false,
      },
      {
        key: "supplier_name",
        label: "Supplier name",
        type: "text",
        required: true,
      },
      {
        key: "supplier_phone",
        label: "Supplier phone",
        type: "text",
        required: false,
      },
      {
        key: "supplier_address",
        label: "Supplier address",
        type: "text",
        required: false,
      },
      {
        key: "supplier_tin",
        label: "Supplier TIN",
        type: "text",
        required: false,
      },
      { key: "note", label: "Note", type: "text", required: false },
    ],
    sampleRows: [
      {
        item_name: "Teft 500ml",
        category: "Beverages",
        unit: "PCS",
        quantity: 240,
        unit_cost: 42,
        unit_sales: 60,
        vat_rate: "15.00",
        registration_date: "2026-03-04",
        expiry_date: "2026-09-04",
        supplier_name: "Supplier PLC",
        supplier_phone: "0911000000",
        supplier_address: "Addis Ababa",
        supplier_tin: "1234567890",
        note: "Entered from the console",
      },
    ],
    notes: [
      "Dates are YYYY-MM-DD; a real Excel date cell also works.",
      "Money and quantity are plain numbers — 1,234.50 reads as 1234.50.",
      "Unit cost is what the supplier was paid per piece, before VAT.",
      "Unit selling price is the shelf price before VAT; VAT % is per line.",
      "A row repeating an existing voucher of the same item, quantity, unit cost and registration date is skipped as a duplicate.",
    ],
  },
  {
    kind: "stockout_request",
    title: "Stock outs",
    description:
      "Leaves the store: damage, expiry, supplier returns, free samples. Each row is its own approved voucher and reduces the lot on hand.",
    requiredModule: "Inventory",
    sheetName: "Stock outs",
    fileBase: "volosync-stock-outs",
    columns: [
      {
        key: "voucher_number",
        label: "Lot voucher",
        type: "text",
        required: false,
        hint: "The voucher printed on the lot. Fill either this or Item name.",
      },
      {
        key: "item_name",
        label: "Item name",
        type: "text",
        required: false,
        hint: "Uses that item's newest lot with stock left.",
      },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "date", label: "Movement date", type: "date", required: true },
      {
        key: "change_reason",
        label: "Reason / stakeholder",
        type: "text",
        required: true,
      },
      {
        key: "changing_amount",
        label: "Value given up",
        type: "money",
        required: false,
        default: "0.00",
      },
      {
        key: "sales_agent",
        label: "Sales agent",
        type: "text",
        required: false,
        hint: "Optional; match by full name.",
      },
      { key: "note", label: "Note", type: "text", required: false },
    ],
    sampleRows: [
      {
        voucher_number: "REG-2026-000001-001",
        item_name: "Teft 500ml",
        quantity: 12,
        date: "2026-03-21",
        change_reason: "Damaged in transit",
        changing_amount: "720.00",
        note: "Entered from the console",
      },
    ],
    notes: [
      "Give either the lot voucher or the item name; the voucher wins.",
      "Quantity must fit what is still on the lot — over-drafts are skipped.",
      "Value given up is the selling value lost (0 for a plain stock out).",
    ],
  },
  {
    kind: "sales_agent",
    title: "Sales agents",
    description:
      "Agents on the wholesaler's shared Sales login. No per-agent username or password is created.",
    requiredModule: "Sales Role",
    sheetName: "Sales agents",
    fileBase: "volosync-sales-agents",
    columns: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text", required: false },
      {
        key: "sex",
        label: "Sex",
        type: "choice",
        required: false,
        options: ["Female", "Male"],
        hint: "Female | Male",
      },
      {
        key: "years_experience",
        label: "Years of experience",
        type: "int",
        required: false,
        default: "0",
        hint: "Whole number 0–80",
      },
      {
        key: "active",
        label: "Active",
        type: "bool",
        required: false,
        default: "TRUE",
        options: ["TRUE", "FALSE"],
        hint: "TRUE | FALSE",
      },
    ],
    sampleRows: [
      {
        full_name: "Sales agent",
        phone: "0911000000",
        sex: "Female",
        years_experience: 3,
        active: "TRUE",
      },
    ],
    notes: [
      "The wholesaler must already have its Sales account in Access; agents are records on that shared login.",
      "Years of experience is clamped to 0-80.",
    ],
  },
];

export function getExcelImportDefinition(
  kind: ExcelImportKind,
): ExcelImportDefinition {
  const def = EXCEL_IMPORT_DEFINITIONS.find((d) => d.kind === kind);
  if (!def) throw new Error(`Unknown excel import kind: ${kind}`);
  return def;
}

export function tenantHasModule(
  modules: string[] | null | undefined,
  required: string,
): boolean {
  const list = (modules ?? []).map((m) => String(m).trim());
  // Require an explicit module so ops do not import into the wrong mix.
  if (list.length === 0) return false;
  return list.includes(required);
}

/** Importers unlocked for this tenant's subscribed modules. */
export function excelImportsForTenant(input: {
  businessType?: string | null | undefined;
  modules: string[] | null | undefined;
}): ExcelImportDefinition[] {
  return EXCEL_IMPORT_DEFINITIONS.filter((def) =>
    tenantHasModule(input.modules, def.requiredModule),
  );
}
