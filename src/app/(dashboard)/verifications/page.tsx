"use client";

import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { usePendingShops } from "@/lib/queries/shops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/nav/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/utils";
import { DOC_LABELS, type DocKey } from "@/types/admin";

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

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="skeleton size-9 shrink-0" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-2.5 w-24 opacity-60" />
              </div>
            </div>
          </TableCell>
          <TableCell><div className="skeleton h-3 w-28" /></TableCell>
          <TableCell><div className="skeleton h-5 w-16 rounded-full" /></TableCell>
          <TableCell><div className="skeleton h-3 w-20" /></TableCell>
          <TableCell><div className="skeleton h-3 w-24" /></TableCell>
          <TableCell><div className="skeleton h-5 w-20 rounded-full" /></TableCell>
          <TableCell><div className="skeleton h-7 w-36 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function VerificationsPage() {
  const { data: shops, isLoading, isError } = usePendingShops();
  const totalDocs = Object.keys(DOC_LABELS).length;
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

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead>Pemilik</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <SkeletonRows />}

              {!isLoading && shops?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                        <Inbox className="size-5" />
                      </div>
                      <p className="text-sm font-medium">Tidak ada toko yang menunggu verifikasi.</p>
                      <p className="text-xs">Antrian baru akan muncul di sini saat pemilik toko mengajukan dokumennya.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {shops?.map((shop) => {
                const reviewed = reviewedCount(shop.docs);
                const progress = totalDocs > 0 ? Math.round((reviewed / totalDocs) * 100) : 0;
                return (
                  <TableRow
                    key={shop.id}
                    className="group cursor-pointer transition-colors hover:bg-primary/[0.03]"
                  >
                    <TableCell className="font-medium">
                      <Link href={`/verifications/${shop.id}`} className="flex items-center gap-3">
                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/12 to-primary/5 text-sm font-bold text-primary transition-transform group-hover:scale-105">
                          {shop.name?.charAt(0).toUpperCase()}
                          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-card bg-amber-500" />
                        </span>
                        <span className="max-w-44 truncate font-semibold group-hover:text-primary">
                          {shop.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="font-medium">{shop.owner?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{shop.owner?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {shop.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span title={new Date(shop.docs_submitted_at).toLocaleString("id-ID")}>
                        {formatRelativeTime(shop.docs_submitted_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium tabular-nums">
                          {reviewed}/{totalDocs}
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
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shop.verification_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="default"
                        nativeButton={false}
                        render={
                          <Link href={`/verifications/${shop.id}`} className="gap-1">
                            Review
                            <ChevronRight className="size-3.5" />
                          </Link>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}