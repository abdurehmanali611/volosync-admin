export type ApexPageMeta = {
  title: string;
  description: string;
};

export function getApexPageMeta(
  pathname: string,
  searchParams: URLSearchParams,
): ApexPageMeta {
  if (pathname === "/dashboard") {
    return {
      title: "Overview",
      description: "Platform health and pending work at a glance",
    };
  }
  if (pathname === "/tenants") {
    if (
      searchParams.get("filter") === "inactive" ||
      searchParams.get("filter") === "setup_pending"
    ) {
      return {
        title: "Inactive Tenants",
        description: "Suspended, banned, and deleted wholesalers",
      };
    }
    return {
      title: "Tenants",
      description: "Search and manage every VoloSync wholesaler",
    };
  }
  if (pathname.startsWith("/tenants/")) {
    return {
      title: "Tenant detail",
      description: "Billing, access control, and staff accounts",
    };
  }
  if (pathname === "/payments/setup") {
    return {
      title: "Setup payments",
      description: "Review and approve one-time setup fee submissions",
    };
  }
  if (pathname === "/payments/yearly") {
    return {
      title: "Yearly payments",
      description: "Review and approve yearly subscription payments for wholesalers",
    };
  }
  if (pathname === "/payments/yearly") {
    return {
      title: "Yearly payments",
      description: "Review and approve yearly subscription payments",
    };
  }
  if (pathname === "/payments") {
    return {
      title: "Setup payments",
      description: "Review and approve one-time setup fee submissions",
    };
  }
  if (pathname === "/feedback") {
    return {
      title: "Wholesaler chat",
      description: "Two-way conversations with wholesalers and wholesalers — start or continue any thread",
    };
  }
  if (pathname === "/users") {
    if (searchParams.get("filter") === "disabled") {
      return {
        title: "Disabled logins",
        description: "Staff accounts with login disabled across all wholesalers",
      };
    }
    return {
      title: "Tenant users",
      description: "Monitor staff accounts across wholesalers and branches",
    };
  }
  if (pathname === "/audit") {
    return {
      title: "Audit log",
      description: "Apex team actions on tenants, users, and billing",
    };
  }
  if (pathname === "/signups") {
    return {
      title: "New signups",
      description: "Registrations awaiting setup fee approval",
    };
  }
  if (pathname === "/sales-agents") {
    return {
      title: "Sales Agents",
      description: "Register the field team who close wholesale deals",
    };
  }
  if (pathname.startsWith("/feedback/")) {
    return {
      title: "Conversation",
      description: "Chat with the wholesaler team in real time",
    };
  }
  return {
    title: "Dashboard",
    description: "VoloSync tenant management",
  };
}
