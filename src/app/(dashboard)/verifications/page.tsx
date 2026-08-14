"use client";

import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { usePendingShops } from "@/lib/queries/shops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/nav/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOC_LABELS, type DocKey } from "@/types/admin";

function reviewedCount(docs: Record<DocKey, { status: string }> | undefined) {
  if (!docs) return 0;
  return Object.values(docs).filter((d) => d.status !== "pending").length;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Menunggu
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Spinner color="brand" size="sm" label="Memuat antrian verifikasi..." />
                      Memuat antrian verifikasi dari server, mohon tunggu...
                    </div>
                  </TableCell>
                </TableRow>
              )}

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
                  <TableRow key={shop.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/verifications/${shop.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                          {shop.name?.charAt(0).toUpperCase()}
                        </span>
                        <span className="max-w-44 truncate">{shop.name}</span>
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
                    <TableCell>
                      {new Date(shop.docs_submitted_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
                            Review &amp; Verifikasi
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
