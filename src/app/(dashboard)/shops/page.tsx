"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, ExternalLink, Store as StoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/nav/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllShops, useSuspendShop } from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Shop } from "@/types/admin";

const STATUS_META: Record<string, { label: string; className: string }> = {
  approved: { label: "Disetujui", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  pending: { label: "Menunggu", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  rejected: { label: "Ditolak", className: "bg-destructive/10 text-destructive" },
  suspended: { label: "Disuspend", className: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", meta?.className ?? "bg-muted text-muted-foreground")}>
      {meta?.label ?? status}
    </Badge>
  );
}

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="skeleton size-9 shrink-0 rounded-xl" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-2.5 w-44 opacity-60" />
              </div>
            </div>
          </TableCell>
          <TableCell><div className="skeleton h-5 w-20 rounded-full" /></TableCell>
          <TableCell><div className="skeleton h-3 w-24" /></TableCell>
          <TableCell><div className="skeleton h-5 w-20 rounded-full" /></TableCell>
          <TableCell><div className="skeleton h-3 w-20" /></TableCell>
          <TableCell><div className="skeleton h-7 w-36 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function SuspendDialog({ shop }: { shop: Shop }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const suspendShop = useSuspendShop();

  function handleSuspend() {
    suspendShop.mutate(
      { shopId: shop.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${shop.name} disuspend`);
          setOpen(false);
          setReason("");
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal suspend toko")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="destructive" className="gap-1.5">
            <Ban className="size-3.5" />
            Suspend
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {shop.name}?</DialogTitle>
          <DialogDescription>
            Toko langsung tidak aktif dan semua booking yang sedang berjalan otomatis dibatalkan.
            Belum ada aksi untuk membatalkan suspend dari dashboard ini — pastikan dulu sebelum lanjut.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Alasan suspend (opsional)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button
            variant="destructive"
            disabled={suspendShop.isPending}
            onClick={handleSuspend}
            className="gap-2"
          >
            {suspendShop.isPending && <Spinner color="danger" size="xs" label="Menyuspend..." />}
            Suspend toko
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShopsPage() {
  const { data: shops, isLoading, isError } = useAllShops();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const s of shops ?? []) set.add(s.verification_status);
    return Array.from(set);
  }, [shops]);

  const filtered = useMemo(() => {
    if (!shops) return [];
    const q = search.trim().toLowerCase();
    return shops.filter((s) => {
      const matchesStatus = status === "all" || s.verification_status === status;
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [shops, search, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Shops"
        description={`Semua toko terdaftar di platform (${isLoading ? "…" : shops?.length ?? 0}).`}
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat direktori toko. Coba muat ulang halaman.
        </div>
      )}

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
        Backend belum punya endpoint <code className="font-mono">GET /admin/shops</code>, jadi
        daftar ini digabung dari <code className="font-mono">/shops</code> (disetujui) +{" "}
        <code className="font-mono">/admin/pending-shops</code> (menunggu). Toko yang pernah{" "}
        <strong>ditolak</strong> tidak muncul di endpoint mana pun sehingga tidak terlihat di sini.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari nama, alamat, atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(value: string) => (value === "all" ? "Semua status" : (STATUS_META[value]?.label ?? value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <SkeletonRows />}

              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                        <StoreIcon className="size-5" />
                      </div>
                      <p className="text-sm font-medium">Tidak ada toko yang cocok dengan filter saat ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtered.map((shop) => (
                  <TableRow key={shop.id} className="group transition-colors hover:bg-primary/[0.03]">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/12 to-primary/5 text-sm font-bold text-primary transition-transform group-hover:scale-105">
                          {shop.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <p className="max-w-52 truncate font-semibold">{shop.name}</p>
                          <p className="max-w-52 truncate text-xs text-muted-foreground">{shop.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {shop.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shop.rating > 0 ? `${shop.rating.toFixed(1)} ★ (${shop.reviews_count})` : "Belum ada rating"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shop.verification_status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span title={new Date(shop.created_at).toLocaleString("id-ID")}>
                        {formatRelativeTime(shop.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          className="gap-1.5"
                          render={
                            <Link href={`/verifications/${shop.id}`}>
                              <ExternalLink className="size-3.5" />
                              Detail
                            </Link>
                          }
                        />
                        <SuspendDialog shop={shop} />
                      </div>
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
