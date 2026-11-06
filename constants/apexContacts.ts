/** Apex escalation contacts. VoloSync has no published numbers or account in code,
 *  so both come from the environment and stay hidden when unset. */
export const APEX_ESCALATION_WHATSAPP: string[] = (
  process.env.NEXT_PUBLIC_APEX_ESCALATION_WHATSAPP ?? ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const APEX_BANK_ACCOUNT: string = (
  process.env.NEXT_PUBLIC_APEX_BANK_ACCOUNT ?? ""
).trim();

export const APEX_BANK_NAME: string = (
  process.env.NEXT_PUBLIC_APEX_BANK_NAME ?? "CBE"
).trim();
