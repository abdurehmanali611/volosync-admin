import {
  APEX_ACTION_NAV,
  APEX_MAIN_NAV,
  APEX_MONITORING_NAV,
} from "@/constants/apexNav";

const ALL_NAV = [...APEX_MAIN_NAV, ...APEX_MONITORING_NAV, ...APEX_ACTION_NAV];

/** Topbar page title — nav labels first, then documented fallbacks. */
export function apexPageTitle(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  for (const item of ALL_NAV) {
    const [path, queryString] = item.href.split("?");
    if (pathname === path || (item.matchPrefix && pathname.startsWith(`${path}/`))) {
      if (queryString) {
        const expected = new URLSearchParams(queryString);
        let match = true;
        for (const [key, value] of expected.entries()) {
          if (searchParams.get(key) !== value) match = false;
        }
        if (match && pathname === path) return item.label;
      } else if (pathname === path && !searchParams.toString()) {
        return item.label;
      } else if (item.matchPrefix && pathname.startsWith(`${path}/`)) {
        return item.label;
      }
    }
  }

  if (pathname.startsWith("/tenants/")) return "Tenant detail";
  if (pathname.startsWith("/payments/")) return "Payments";
  if (pathname.startsWith("/reports")) return "Analytics & reports";

  return "Apex console";
}
