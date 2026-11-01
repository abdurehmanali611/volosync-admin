"use client";

import * as React from "react";
import {
  flexRender,
  type OnChangeFn,
  type PaginationState,
  type RowData,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type LegacyColumnDef,
  type LegacyRow,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import type { ColumnVisibilityState } from "@tanstack/table-core";
import { ChevronLeft, ChevronRight, Search, Settings2 } from "lucide-react";
import { ApexTableWrap } from "@/components/apex/layout/ApexPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ApexDataTableProps<TData extends RowData> = {
  data: TData[];
  columns: LegacyColumnDef<TData, unknown>[];
  emptyState?: React.ReactNode;
  pageSize?: number;
  noun?: string;
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: TData) => string | undefined);
  searchPlaceholder?: string;
  showToolbar?: boolean;
};

function stringifySearchValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifySearchValue(item)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => stringifySearchValue(item))
      .join(" ");
  }
  return "";
}

function columnVisibilityLabel<TData extends RowData>(
  column: {
    id: string;
    columnDef: LegacyColumnDef<TData, unknown>;
  },
): string {
  const meta = column.columnDef.meta as { label?: string } | undefined;
  if (meta?.label?.trim()) return meta.label.trim();

  const header = column.columnDef.header;
  if (typeof header === "string" && header.trim()) return header.trim();

  return column.id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function ApexDataTable<TData extends RowData>({
  data,
  columns,
  emptyState,
  pageSize = 10,
  noun = "rows",
  className,
  tableClassName,
  rowClassName,
  searchPlaceholder = "Search…",
  showToolbar = false,
}: ApexDataTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Reset to the first page when the caller changes the page size.
  // (Derived during render instead of a setState-in-effect cascade.)
  const [lastPageSize, setLastPageSize] = React.useState(pageSize);
  if (lastPageSize !== pageSize) {
    setLastPageSize(pageSize);
    setPagination({ pageIndex: 0, pageSize });
  }

  const table = useLegacyTable({
    data,
    columns,
    state: {
      pagination,
      columnVisibility,
      globalFilter,
    },
    onPaginationChange: setPagination as OnChangeFn<PaginationState>,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel<TData>(),
    getFilteredRowModel: getFilteredRowModel<TData>(),
    getPaginationRowModel: getPaginationRowModel<TData>(),
    globalFilterFn: (
      row: LegacyRow<TData>,
      _columnId: string,
      filterValue: unknown,
    ): boolean => {
      const needle = String(filterValue ?? "").trim().toLowerCase();
      if (!needle) return true;
      return stringifySearchValue(row.original).toLowerCase().includes(needle);
    },
  });

  const rows = table.getRowModel().rows;
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const filteredNoun = filteredTotal === 1 ? noun.replace(/s$/, "") : noun;
  const pageCount = table.getPageCount();
  const start =
    filteredTotal === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(
    filteredTotal,
    (pagination.pageIndex + 1) * pagination.pageSize,
  );
  const visibleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() &&
        !["actions", "action", "review", "open"].includes(column.id),
    );

  if (data.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      {showToolbar ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                table.setPageIndex(0);
              }}
              className="apex-search-input h-11 rounded-xl pl-10"
            />
          </div>

          {visibleColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 gap-2 rounded-xl px-4 sm:w-auto"
                >
                  <Settings2 className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {visibleColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {columnVisibilityLabel(column)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}

      <ApexTableWrap>
        <Table className={cn("min-w-full", tableClassName)}>
          <TableHeader className="bg-white/2">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { headerClassName?: string }
                    | undefined;
                  const size = header.column.columnDef.size;
                  const minSize = header.column.columnDef.minSize;
                  const maxSize = header.column.columnDef.maxSize;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-3 text-[11px] font-semibold tracking-[0.16em] text-[oklch(0.78_0.03_162)] uppercase",
                        meta?.headerClassName,
                      )}
                      style={{
                        ...(typeof size === "number" ? { width: size } : null),
                        ...(typeof minSize === "number" ? { minWidth: minSize } : null),
                        ...(typeof maxSize === "number" ? { maxWidth: maxSize } : null),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "apex-table-row border-white/6 transition-colors hover:bg-white/2.5",
                  typeof rowClassName === "function"
                    ? rowClassName(row.original)
                    : rowClassName,
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as
                    | { className?: string }
                    | undefined;
                  const size = cell.column.columnDef.size;
                  const minSize = cell.column.columnDef.minSize;
                  const maxSize = cell.column.columnDef.maxSize;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn("px-3 py-3.5 align-top", meta?.className)}
                      style={{
                        ...(typeof size === "number" ? { width: size } : null),
                        ...(typeof minSize === "number" ? { minWidth: minSize } : null),
                        ...(typeof maxSize === "number" ? { maxWidth: maxSize } : null),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ApexTableWrap>

      <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{start}–{end}</span>{" "}
          of <span className="font-medium text-foreground">{filteredTotal}</span>{" "}
          {filteredNoun}
        </p>

        {pageCount > 1 ? (
          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
