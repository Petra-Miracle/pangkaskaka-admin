"use client";

import Link from "next/link";
import { ChevronRight, FileCheck2, Gavel, Inbox } from "lucide-react";
import { usePendingShops } from "@/lib/queries/shops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@heroui/react";
import { PageHeader } from "@/components/nav/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { cn, formatRelativeTime } from "@/lib/utils";
import { DOC_LABELS, type DocKey, type Shop } from "@/types/admin";

function reviewedCount(docs: Record<DocKey, { status: string }> | undefined) {
  if (!docs) return 0;
  return Object.values(docs).filter((d) => d.status !== "pending").length;
}

const columnHelper = legacyCreateColumnHelper<Shop>();

const TOTAL_DOCS = Object.keys(DOC_LABELS).length;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack v9 column defs are invariant over TValue
const columns: LegacyColumnDef<Shop, any>[] = [
  columnHelper.accessor("name", {
    header: "Toko",
    cell: ({ row }) => (
      <Link href={`/verifications/${row.original.id}`} className="flex items-center gap-3">
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent-200/70 bg-accent-50 text-sm font-bold text-accent-600">
          {row.original.name?.charAt(0).toUpperCase()}
          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-card bg-warning" />
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
                progress === 100 ? "bg-success" : "bg-primary"
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

  const reviewedDocs = shops
    ? shops.reduce((sum, s) => sum + reviewedCount(s.docs), 0)
    : 0;
  const totalDocs = shops ? shops.length * TOTAL_DOCS : 0;
  const readyToDecide = shops
    ? shops.filter((s) => reviewedCount(s.docs) === TOTAL_DOCS).length
    : 0;

  const summary = [
    {
      label: "Antrian menunggu",
      value: isLoading ? "…" : count,
      icon: Inbox,
      accent: "text-warning",
      tile: "bg-warning-bg text-warning",
    },
    {
      label: "Dokumen direview",
      value: isLoading ? "…" : `${reviewedDocs}/${totalDocs}`,
      icon: FileCheck2,
      accent: "text-ink-900",
      tile: "bg-accent-50 text-accent-600",
    },
    {
      label: "Siap diputuskan",
      value: isLoading ? "…" : readyToDecide,
      icon: Gavel,
      accent: "text-success",
      tile: "bg-success-bg text-success",
    },
  ];

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

      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-soft transition-colors hover:border-primary/20"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", item.tile)}>
              <item.icon className="size-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className={cn("text-lg font-bold tabular-nums", item.accent)}>{item.value}</p>
              <p className="truncate text-[11px] font-medium text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="glass-card overflow-hidden p-0 animate-fade-up [animation-delay:120ms]">
        <Card.Content className="p-0">
          <DataTable
            columns={columns}
            data={shops ?? []}
            loading={isLoading}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={Inbox}
                title="Tidak ada toko yang menunggu verifikasi"
                description="Antrian baru muncul di sini saat pemilik toko mengajukan dokumennya."
              />
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}