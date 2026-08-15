"use client";

import * as React from "react";
import {
  useLegacyTable,
  legacyCreateColumnHelper,
  getSortedRowModel,
  getPaginationRowModel,
  type LegacyReactTable,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export { legacyCreateColumnHelper };

function SortIndicator({ state }: { state: false | "asc" | "desc" }) {
  if (state === "asc") return <ArrowUp className="size-3 text-primary" />;
  if (state === "desc") return <ArrowDown className="size-3 text-primary" />;
  return <ChevronsUpDown className="size-3 text-muted-foreground/50" />;
}

type DataTableProps<TData> = {
  columns: readonly unknown[];
  data: TData[];
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode;
  className?: string;
  initialSorting?: { id: string; desc: boolean }[];
  pageSize?: number;
  pageSizeOptions?: number[];
};

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  skeletonRows = 6,
  onRowClick,
  emptyState,
  className,
  initialSorting,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
}: DataTableProps<TData>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy v8-compat hook is generic over any row type
  const table = (useLegacyTable as unknown as (o: object) => LegacyReactTable<any>)({
    data,
    columns,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: initialSorting,
      pagination: { pageIndex: 0, pageSize },
    },
    autoResetPageIndex: false,
  });

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const rows = table.getRowModel().rows;
  const totalRows = table.getRowCount();
  const from = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1;
  const to = Math.min(totalRows, (pageIndex + 1) * currentPageSize);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "bg-muted/30 h-10",
                        canSort && "cursor-pointer select-none"
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <span className="inline-flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIndicator state={sorted} />}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                    {table.getVisibleLeafColumns().map((column) => (
                      <TableCell key={column.id} className="py-3">
                        <div
                          className="skeleton h-4 w-full"
                          style={{
                            width:
                              column.id === "actions"
                                ? "5rem"
                                : `${Math.max(32, Math.min(85, 100 - ((i * 13 + column.id.length * 7) % 50)))}%`,
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.length === 0
                ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={table.getVisibleLeafColumns().length} className="py-14 text-center">
                        {emptyState ?? (
                          <p className="text-sm text-muted-foreground">Tidak ada data.</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                : rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "transition-colors hover:bg-primary/[0.03]",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>

      {!loading && totalRows > 0 && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {from}–{to} dari {totalRows}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <div className="flex items-center gap-1">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => table.setPageSize(size)}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-medium tabular-nums transition-colors",
                    currentPageSize === size
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-3.5" />
              Sebelumnya
            </Button>
            <span className="min-w-16 text-center text-xs font-medium text-muted-foreground tabular-nums">
              Hal {pageIndex + 1}/{Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Berikutnya
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}