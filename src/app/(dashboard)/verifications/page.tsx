"use client";

import Link from "next/link";
import { usePendingShops } from "@/lib/queries/shops";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function VerificationsPage() {
  const { data: shops, isLoading, isError } = usePendingShops();
  const totalDocs = Object.keys(DOC_LABELS).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verifications</h1>
        <p className="text-sm text-muted-foreground">
          Semua toko yang menunggu verifikasi ({shops?.length ?? "…"}).
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Gagal memuat antrian verifikasi.</p>
      )}

      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead>Pemilik</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && shops?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Tidak ada toko yang menunggu verifikasi.
                  </TableCell>
                </TableRow>
              )}

              {shops?.map((shop) => (
                <TableRow key={shop.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/verifications/${shop.id}`} className="hover:underline">
                      {shop.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p>{shop.owner?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{shop.owner?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{shop.category}</TableCell>
                  <TableCell>
                    {new Date(shop.docs_submitted_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {reviewedCount(shop.docs)}/{totalDocs} direview
                  </TableCell>
                  <TableCell>
                    <Badge variant={shop.verification_status === "pending" ? "outline" : "default"}>
                      {shop.verification_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
