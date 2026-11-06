const TOKEN_KEY = "apex_auth_token";
const MEMBER_KEY = "apex_member";

export type ApexMember = {
  id: number;
  UserName: string;
  displayName: string | null;
  role: string;
};

export function getApexToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getApexMember(): ApexMember | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApexMember;
  } catch {
    return null;
  }
}

export function persistApexSession(token: string, member: ApexMember) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function clearApexSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(MEMBER_KEY);
}
