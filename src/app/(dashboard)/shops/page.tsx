"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, ExternalLink, Info, Store as StoreIcon, UserCog, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@heroui/react";
import { SearchBox } from "@/components/ui/search-box";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
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
import { useAllShops, useSuspendShop } from "@/lib/queries/shops";
import { useShopAdmins } from "@/lib/queries/admins";
import { CreateShopAdminDialog } from "@/components/admins/create-admin-dialog";
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

// Aksi "Buat admin" per baris — memanggil useShopAdmins() sendiri (React Query
// men-dedup ke satu request, cache-nya sama dengan halaman Kelola Admin). Kalau
// toko sudah punya admin, tombolnya dinonaktifkan (aturan 1 toko = 1 admin).
function ShopAdminAction({ shop }: { shop: Shop }) {
  const { data: admins } = useShopAdmins();
  const existing = admins?.find((a) => a.managed_shop_ids.includes(shop.id));

  if (existing) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 opacity-60"
        disabled
        title={`Sudah dikelola admin: ${existing.name}`}
      >
        <UserCog className="size-3.5" />
        Ada admin
      </Button>
    );
  }

  return (
    <CreateShopAdminDialog
      lockedShop={{ id: shop.id, name: shop.name }}
      trigger={
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="size-3.5" />
          Buat admin
        </Button>
      }
    />
  );
}

const columnHelper = legacyCreateColumnHelper<Shop>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack v9 column defs are invariant over TValue
const columns: LegacyColumnDef<Shop, any>[] = [
  columnHelper.accessor("name", {
    header: "Toko",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/12 to-primary/5 text-sm font-bold text-primary">
          {row.original.name?.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="max-w-52 truncate font-semibold">{row.original.name}</p>
          <p className="max-w-52 truncate text-xs text-muted-foreground">{row.original.address}</p>
        </div>
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
  columnHelper.accessor("rating", {
    header: "Rating",
    cell: (info) => (
      <span className="text-muted-foreground">
        {rowRating(info.row.original)}
      </span>
    ),
  }),
  columnHelper.accessor("verification_status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue() as string} />,
  }),
  columnHelper.accessor("created_at", {
    header: "Terdaftar",
    cell: (info) => (
      <span className="text-muted-foreground" title={new Date(info.getValue() as string).toLocaleString("id-ID")}>
        {formatRelativeTime(info.getValue() as string)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          className="gap-1.5"
          render={
            <Link href={`/verifications/${row.original.id}`}>
              <ExternalLink className="size-3.5" />
              Detail
            </Link>
          }
        />
        <ShopAdminAction shop={row.original} />
        <SuspendDialog shop={row.original} />
      </div>
    ),
  }),
];

function rowRating(shop: Shop) {
  return shop.rating > 0 ? `${shop.rating.toFixed(1)} ★ (${shop.reviews_count})` : "Belum ada rating";
}

export default function ShopsPage() {
  const { data: shops, isLoading, isError } = useAllShops();
  const [search, setSearch] = useState("");

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(id);
  }, [search]);
  const searching = debounced !== search;

  const filtered = useMemo(() => {
    if (!shops) return [];
    const q = debounced.trim().toLowerCase();
    return shops.filter((s) => {
      return (
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      );
    });
  }, [shops, debounced]);

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

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 animate-fade-up [animation-delay:60ms]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Info className="size-3.5" />
        </span>
        <p className="leading-relaxed">
          Backend belum punya endpoint <code className="font-mono">GET /admin/shops</code>, jadi daftar ini
          digabung dari <code className="font-mono">/shops</code> (disetujui) +{" "}
          <code className="font-mono">/admin/pending-shops</code> (menunggu). Toko yang pernah{" "}
          <strong>ditolak</strong> tidak muncul di endpoint mana pun sehingga tidak terlihat di sini.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          placeholder="Cari nama, alamat, atau kategori..."
          value={search}
          onChange={setSearch}
          icon={<StoreIcon className="size-4" />}
          busy={isLoading || searching}
        />
      </div>

      <Card className="glass-card overflow-hidden p-0 animate-fade-up [animation-delay:120ms]">
        <Card.Content className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            initialSorting={[{ id: "created_at", desc: true }]}
            pageSize={10}
            emptyState={
              <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
                  <StoreIcon className="size-5" />
                </div>
                <p className="text-sm font-medium">Tidak ada toko yang cocok dengan filter saat ini.</p>
              </div>
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}