/** Canonical company axes stored on tenant rows — no extra types. */
export const APEX_BUSINESS_TYPES = [
  { key: "Company", label: "Company" },
  { key: "Branch", label: "Branch" },
] as const;

export type ApexBusinessTypeKey = (typeof APEX_BUSINESS_TYPES)[number]["key"];

export function businessTypeLabel(key: string | null | undefined) {
  if (!key) return "—";
  const normalized = normalizeBusinessTypeKey(key);
  return (
    APEX_BUSINESS_TYPES.find((b) => b.key === normalized)?.label ?? key
  );
}

/** Maps legacy DB values (main / sub-branch) to the two company axes. */
export function normalizeBusinessTypeKey(raw: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (!s) return "Company";
  const lower = s.toLowerCase();
  if (lower === "branch" || lower === "sub-branch" || lower === "satellite") {
    return "Branch";
  }
  if (lower === "company" || lower === "main" || lower === "head office") {
    return "Company";
  }
  return s;
}
