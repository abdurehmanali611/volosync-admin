"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useCreateTenantSheet } from "@/lib/apex/create-tenant-sheet";

type Props = Omit<ComponentProps<typeof Button>, "onClick"> & {
  onOpen?: () => void;
};

export function ApexCreateTenantTrigger({ onOpen, children, ...props }: Props) {
  const { openCreateTenantSheet } = useCreateTenantSheet();

  return (
    <Button
      type="button"
      {...props}
      onClick={() => {
        openCreateTenantSheet();
        onOpen?.();
      }}
    >
      {children}
    </Button>
  );
}
