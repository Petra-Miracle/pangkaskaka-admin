"use client";

import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { usePendingShops } from "@/lib/queries/shops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@heroui/react";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { formatRelativeTime } from "@/lib/utils";
import { DOC_LABELS, type DocKey, type Shop } from "@/types/admin";

function reviewedCount(docs: Record<DocKey, { status: string }> | undefined) {
  if (!docs) return 0;
  return Object.values(docs).filter((d) => d.status !== "pending").length;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
        </span>
        Menunggu
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
}

const columnHelper = legacyCreateColumnHelper<Shop>();

const TOTAL_DOCS = Object.keys(DOC_LABELS).length;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack v9 column defs are invariant over TValue
const columns: LegacyColumnDef<Shop, any>[] = [
  columnHelper.accessor("name", {
    header: "Toko",
    cell: ({ row }) => (
      <Link href={`/verifications/${row.original.id}`} className="flex items-center gap-3">
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/12 to-primary/5 text-sm font-bold text-primary">
          {row.original.name?.charAt(0).toUpperCase()}
          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-card bg-amber-500" />
        </span>
        <span className="max-w-44 truncate font-semibold group-hover:text-primary">{row.original.name}</span>
      </Link>
    ),
  }),
  columnHelper.display({
    id: "owner",
    header: "Pemilik",
    cell: ({ row }) => (
      <div className="leading-tight">
        <p className="font-medium">{row.original.owner?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.original.owner?.email}</p>
      </div>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Kategori",
    cell: (info) => (
      <Badge variant="secondary" className="font-normal">
        {info.getValue() as string}
      </Badge>
    ),
  }),
  columnHelper.accessor("docs_submitted_at", {
    header: "Diajukan",
    cell: (info) => (
      <span className="text-muted-foreground" title={new Date(info.getValue() as string).toLocaleString("id-ID")}>
        {formatRelativeTime(info.getValue() as string)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "docs",
    header: "Dokumen",
    cell: ({ row }) => {
      const reviewed = reviewedCount(row.original.docs);
      const progress = Math.round((reviewed / TOTAL_DOCS) * 100);
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums">
            {reviewed}/{TOTAL_DOCS}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                progress === 100 ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("verification_status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue() as string} />,
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="default"
          nativeButton={false}
          render={
            <Link href={`/verifications/${row.original.id}`} className="gap-1">
              Review
              <ChevronRight className="size-3.5" />
            </Link>
          }
        />
      </div>
    ),
  }),
];

export default function VerificationsPage() {
  const { data: shops, isLoading, isError } = usePendingShops();
  const count = shops?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderasi"
        title="Verifications"
        description={`Semua toko yang menunggu verifikasi (${isLoading ? "…" : count}).`}
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat antrian verifikasi. Coba muat ulang halaman.
        </div>
      )}

      <Card className="glass-card overflow-hidden p-0">
        <Card.Content className="p-0">
          <DataTable
            columns={columns}
            data={shops ?? []}
            loading={isLoading}
            pageSize={10}
            emptyState={
              <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                  <Inbox className="size-5" />
                </div>
                <p className="text-sm font-medium">Tidak ada toko yang menunggu verifikasi.</p>
                <p className="text-xs">Antrian baru akan muncul di sini saat pemilik toko mengajukan dokumennya.</p>
              </div>
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}