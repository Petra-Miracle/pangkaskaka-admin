"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@heroui/react";
import { KeyRound, Store, UserCog, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBox } from "@/components/ui/search-box";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { CreateShopAdminDialog } from "@/components/admins/create-admin-dialog";
import { CredentialDialog, type IssuedCredential } from "@/components/admins/credential-dialog";
import {
  useResetShopAdminPassword,
  useShopAdmins,
  useUpdateShopAdminScope,
} from "@/lib/queries/admins";
import { useAllShops } from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { ShopAdmin } from "@/types/admin";

function initialsOf(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function shopNameOf(admin: ShopAdmin) {
  return admin.managed_shops?.[0]?.name ?? null;
}

function MoveShopDialog({ admin }: { admin: ShopAdmin }) {
  const [open, setOpen] = useState(false);
  const currentShopId = admin.managed_shop_ids[0] ?? null;
  const [shopId, setShopId] = useState<string | null>(currentShopId);

  const { data: shops } = useAllShops();
  const { data: admins } = useShopAdmins();
  const updateScope = useUpdateShopAdminScope();

  const takenByOthers = useMemo(
    () =>
      new Set(
        (admins ?? [])
          .filter((a) => a.id !== admin.id)
          .flatMap((a) => a.managed_shop_ids)
      ),
    [admins, admin.id]
  );

  const options = useMemo(
    () =>
      (shops ?? [])
        .filter((s) => !takenByOthers.has(s.id) && s.id !== currentShopId)
        .sort((a, b) => a.name.localeCompare(b.name, "id")),
    [shops, takenByOthers, currentShopId]
  );

  // Nama toko dari id — `managed_shops` (sudah di-join backend) jadi sumber utama
  // supaya trigger tidak pernah menampilkan UUID mentah walau daftar shop
  // (`useAllShops`) belum termuat atau toko-nya di luar daftar itu.
  const shopNameById = (id: string | null) => {
    if (!id) return null;
    return (
      admin.managed_shops?.find((s) => s.id === id)?.name ??
      shops?.find((s) => s.id === id)?.name ??
      null
    );
  };

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setShopId(currentShopId);
  }

  function handleSubmit() {
    if (!shopId) return;
    updateScope.mutate(
      { id: admin.id, managedShopIds: [shopId] },
      {
        onSuccess: () => {
          const name = shops?.find((s) => s.id === shopId)?.name ?? "toko baru";
          toast.success(`${admin.name} sekarang mengelola ${name}`);
          setOpen(false);
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal memindahkan admin")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Pindahkan ke toko lain"
            title="Pindahkan ke toko lain"
          >
            <Store className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pindahkan {admin.name}</DialogTitle>
          <DialogDescription>
            Admin berhenti mengelola toko saat ini dan langsung menangani toko yang dipilih. Toko yang
            sudah punya admin lain tidak muncul di daftar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="move-shop">Toko baru</Label>
          <Select value={shopId} onValueChange={(value) => setShopId((value as string | null) ?? null)}>
            <SelectTrigger id="move-shop" className="w-full">
              <SelectValue placeholder="Pilih toko...">
                {(value: string | null) => shopNameById(value) ?? "Pilih toko..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Tidak ada toko lain yang bisa dipilih.
                </div>
              ) : (
                options.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {shopNameById(currentShopId) && (
            <p className="text-xs text-muted-foreground">
              Sekarang mengelola: <span className="font-medium">{shopNameById(currentShopId)}</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button
            disabled={!shopId || shopId === currentShopId || updateScope.isPending}
            onClick={handleSubmit}
            className="gap-2"
          >
            {updateScope.isPending && <Spinner color="brand" size="xs" label="Menyimpan..." />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ admin }: { admin: ShopAdmin }) {
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedCredential | null>(null);
  const resetPassword = useResetShopAdminPassword();

  function handleConfirm() {
    resetPassword.mutate(admin.id, {
      onSuccess: (res) => {
        setOpen(false);
        setIssued({
          title: `Password baru untuk ${admin.name}`,
          email: admin.email,
          password: res.password,
        });
      },
      onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal reset password")),
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Reset password"
              title="Reset password"
            >
              <KeyRound className="size-3.5" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password {admin.name}?</DialogTitle>
            <DialogDescription>
              Password lama langsung tidak berlaku. Password baru dibuat otomatis dan ditampilkan sekali
              di layar ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Batal</Button>} />
            <Button onClick={handleConfirm} disabled={resetPassword.isPending} className="gap-2">
              {resetPassword.isPending && <Spinner color="brand" size="xs" label="Memproses..." />}
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialDialog credential={issued} onClose={() => setIssued(null)} />
    </>
  );
}

const columnHelper = legacyCreateColumnHelper<ShopAdmin>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack v9 column defs are invariant over TValue
const columns: LegacyColumnDef<ShopAdmin, any>[] = [
  columnHelper.accessor("name", {
    header: "Nama",
    cell: ({ row, getValue }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-9 border border-primary/10">
          <AvatarFallback className="bg-gradient-to-br from-primary/12 to-primary/5 text-xs font-bold text-primary">
            {initialsOf(getValue() as string | undefined)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="max-w-52 truncate font-semibold">{getValue() as string}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.phone || "—"}</p>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <span className="text-muted-foreground">{info.getValue() as string}</span>,
  }),
  columnHelper.display({
    id: "shop",
    header: "Toko dikelola",
    cell: ({ row }) => {
      const name = shopNameOf(row.original);
      return name ? (
        <Badge variant="outline" className="gap-1.5 border-transparent bg-primary/10 font-medium text-primary">
          <Store className="size-3" />
          {name}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Belum ada toko</span>
      );
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Dibuat",
    cell: (info) => (
      <span
        className="text-muted-foreground"
        title={new Date(info.getValue() as string).toLocaleString("id-ID")}
      >
        {formatRelativeTime(info.getValue() as string)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <MoveShopDialog admin={row.original} />
        <ResetPasswordDialog admin={row.original} />
      </div>
    ),
  }),
];

export default function AdminsPage() {
  const { data: admins, isLoading, isError } = useShopAdmins();
  const { data: shops } = useAllShops();
  const [search, setSearch] = useState("");

  const shopsWithoutAdmin = useMemo(() => {
    if (!shops) return null;
    const taken = new Set((admins ?? []).flatMap((a) => a.managed_shop_ids));
    return shops.filter((s) => !taken.has(s.id)).length;
  }, [shops, admins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (admins ?? []).filter(
      (a) =>
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        (shopNameOf(a) ?? "").toLowerCase().includes(q)
    );
  }, [admins, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akses"
        title="Kelola Admin"
        description={`Akun admin per toko — validasi pelamar StreetBarber (${isLoading ? "…" : admins?.length ?? 0}).`}
        actions={
          <CreateShopAdminDialog
            trigger={
              <Button className="gap-2">
                <UserPlus className="size-4" />
                Buat Admin
              </Button>
            }
          />
        }
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat daftar admin. Coba muat ulang halaman.
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/[0.03] px-4 py-3 text-xs text-muted-foreground animate-fade-up [animation-delay:60ms]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserCog className="size-3.5" />
        </span>
        <p className="leading-relaxed">
          Satu toko hanya bisa punya <strong>satu</strong> admin. Password dibuat otomatis oleh sistem dan
          ditampilkan sekali saja saat akun jadi — kalau hilang, pakai tombol reset password.
          {shopsWithoutAdmin !== null && shopsWithoutAdmin > 0 && (
            <> Saat ini <strong>{shopsWithoutAdmin}</strong> toko belum punya admin.</>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          placeholder="Cari nama, email, atau toko..."
          value={search}
          onChange={setSearch}
          icon={<UserCog className="size-4" />}
          busy={isLoading}
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
                  <UserCog className="size-5" />
                </div>
                <p className="text-sm font-medium">
                  {admins?.length === 0
                    ? "Belum ada akun admin toko. Buat yang pertama lewat tombol di atas."
                    : "Tidak ada admin yang cocok dengan pencarian."}
                </p>
              </div>
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}
