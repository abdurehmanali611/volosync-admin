"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CreateTenantSheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCreateTenantSheet: () => void;
};

const CreateTenantSheetContext = createContext<CreateTenantSheetContextValue | null>(
  null,
);

export function CreateTenantSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openCreateTenantSheet = useCallback(() => setOpen(true), []);

  const value = useMemo(
    () => ({ open, setOpen, openCreateTenantSheet }),
    [open, openCreateTenantSheet],
  );

  return (
    <CreateTenantSheetContext.Provider value={value}>
      {children}
    </CreateTenantSheetContext.Provider>
  );
}

export function useCreateTenantSheet() {
  const ctx = useContext(CreateTenantSheetContext);
  if (!ctx) {
    throw new Error("useCreateTenantSheet must be used within CreateTenantSheetProvider");
  }
  return ctx;
}
