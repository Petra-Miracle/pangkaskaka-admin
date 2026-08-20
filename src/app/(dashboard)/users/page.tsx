"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Eye, RotateCcw, Scissors, ShieldCheck, Store, Trash2, UserCog, Users as UsersIcon } from "lucide-react";
import { Card } from "@heroui/react";
import { SearchBox } from "@/components/ui/search-box";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useActivateUser, useAllUsers, useDeleteUser, useSuspendUser, useUpdateUserRole } from "@/lib/queries/users";
import { getSafeErrorMessage } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ADMIN_USER_ROLES, type AdminUser, type AdminUserRole } from "@/types/admin";
import { cn, formatRelativeTime } from "@/lib/utils";

const ROLE_META: Record<AdminUserRole, { label: string; chip: string; dot: string; icon: typeof UsersIcon }> = {
  admin: {
    label: "Admin",
    chip: "bg-primary/10 text-primary",
    dot: "bg-primary",
    icon: ShieldCheck,
  },
  owner: {
    label: "Pemilik toko",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    icon: Store,
  },
  karyawan: {
    label: "Karyawan",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    icon: Scissors,
  },
  customer: {
    label: "Customer",
    chip: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    icon: UsersIcon,
  },
};

function initialsOf(name: string | undefined) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return suspended ? (
    <Badge variant="outline" className="border-transparent bg-destructive/10 font-medium text-destructive">
      Ditangguhkan
    </Badge>
  ) : (
    <Badge variant="outline" className="border-transparent bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400">
      Aktif
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-56 truncate text-right font-medium">{value}</span>
    </div>
  );
}

function UserDetailDialog({ user }: { user: AdminUser }) {
  const meta = ROLE_META[user.role as AdminUserRole];
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" className="size-8" aria-label="Lihat detail" title="Lihat detail">
            <Eye className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="size-10 border border-primary/10">
              <AvatarFallback className="bg-gradient-to-br from-primary/12 to-primary/5 text-sm font-bold text-primary">
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
            {user.name}
          </DialogTitle>
          <DialogDescription>Detail akun terdaftar di platform.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Role</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                meta?.chip ?? "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-muted-foreground")} />
              {meta?.label ?? user.role}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge suspended={!!user.is_suspended} />
          </div>
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Telepon" value={user.phone || "—"} />
          <DetailRow label="Alamat" value={user.address || "—"} />
          <DetailRow label="Terdaftar" value={new Date(user.created_at).toLocaleString("id-ID")} />
          {user.is_suspended && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-medium">Alasan penangguhan</p>
              <p className="mt-0.5 text-destructive/80">{user.suspended_reason || "Tidak ada alasan dicatat."}</p>
              {user.suspended_at && (
                <p className="mt-1 text-destructive/60">{new Date(user.suspended_at).toLocaleString("id-ID")}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Tutup</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LockedActionButton({ icon: Icon, reason }: { icon: typeof Ban; reason?: string }) {
  return (
    <Button size="icon" variant="ghost" className="size-8 opacity-40" disabled title={reason}>
      <Icon className="size-3.5" />
    </Button>
  );
}

function SuspendToggleDialog({ user, disabled, disabledReason }: { user: AdminUser; disabled?: boolean; disabledReason?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const isSuspended = !!user.is_suspended;

  if (disabled) {
    return <LockedActionButton icon={isSuspended ? RotateCcw : Ban} reason={disabledReason} />;
  }

  if (isSuspended) {
    function handleActivate() {
      activateUser.mutate(user.id, {
        onSuccess: () => toast.success(`${user.name} diaktifkan kembali`),
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal mengaktifkan akun")),
      });
    }
    return (
      <Button
        size="icon"
        variant="ghost"
        className="size-8 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
        aria-label="Aktifkan kembali"
        title="Aktifkan kembali"
        disabled={activateUser.isPending}
        onClick={handleActivate}
      >
        {activateUser.isPending ? <Spinner color="success" size="xs" label="Mengaktifkan..." /> : <RotateCcw className="size-3.5" />}
      </Button>
    );
  }

  function handleSuspend() {
    suspendUser.mutate(
      { id: user.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${user.name} ditangguhkan`);
          setOpen(false);
          setReason("");
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menangguhkan akun")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" aria-label="Tangguhkan" title="Tangguhkan akun">
            <Ban className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tangguhkan {user.name}?</DialogTitle>
          <DialogDescription>
            Akun tidak bisa login sampai diaktifkan kembali dari sini. Data dan riwayatnya tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        <Textarea placeholder="Alasan penangguhan (opsional)..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button variant="destructive" disabled={suspendUser.isPending} onClick={handleSuspend} className="gap-2">
            {suspendUser.isPending && <Spinner color="danger" size="xs" label="Menangguhkan..." />}
            Tangguhkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({ user, disabled, disabledReason }: { user: AdminUser; disabled?: boolean; disabledReason?: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AdminUserRole>((user.role as AdminUserRole) ?? "customer");
  const updateRole = useUpdateUserRole();

  if (disabled) {
    return <LockedActionButton icon={UserCog} reason={disabledReason} />;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setRole((user.role as AdminUserRole) ?? "customer");
  }

  function handleSubmit() {
    updateRole.mutate(
      { id: user.id, role },
      {
        onSuccess: () => {
          toast.success(`Role ${user.name} diubah ke ${ROLE_META[role]?.label ?? role}`);
          setOpen(false);
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal mengubah role")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" className="size-8" aria-label="Ubah role" title="Ubah role">
            <UserCog className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah role {user.name}</DialogTitle>
          <DialogDescription>
            Role menentukan akses fitur di aplikasi mobile. Perubahan berlaku langsung setelah disimpan.
          </DialogDescription>
        </DialogHeader>
        <Select value={role} onValueChange={(value) => setRole((value as AdminUserRole) ?? "customer")}>
          <SelectTrigger>
            <SelectValue>{(value: AdminUserRole) => ROLE_META[value]?.label ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ADMIN_USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_META[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button disabled={updateRole.isPending || role === user.role} onClick={handleSubmit} className="gap-2">
            {updateRole.isPending && <Spinner color="brand" size="xs" label="Menyimpan..." />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user, disabled, disabledReason }: { user: AdminUser; disabled?: boolean; disabledReason?: string }) {
  const [open, setOpen] = useState(false);
  const deleteUser = useDeleteUser();

  if (disabled) {
    return <LockedActionButton icon={Trash2} reason={disabledReason} />;
  }

  function handleDelete() {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${user.name} dihapus`);
        setOpen(false);
      },
      onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menghapus akun")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" aria-label="Hapus akun" title="Hapus akun">
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus akun {user.name}?</DialogTitle>
          <DialogDescription>
            Aksi ini permanen dan tidak bisa dibatalkan. Untuk pemilik toko yang masih punya toko terdaftar, hapus
            atau alihkan tokonya dulu — permintaan hapus akan ditolak selama itu belum dilakukan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button variant="destructive" disabled={deleteUser.isPending} onClick={handleDelete} className="gap-2">
            {deleteUser.isPending && <Spinner color="danger" size="xs" label="Menghapus..." />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserActionsCell({ user }: { user: AdminUser }) {
  const currentUser = getUser();
  const isSelf = currentUser?.id === user.id;
  const isAdminRow = user.role === "admin";
  const locked = isSelf || isAdminRow;
  const lockedReason = isSelf ? "Tidak bisa mengubah akun sendiri" : isAdminRow ? "Akun admin tidak bisa diubah dari sini" : undefined;

  return (
    <div className="flex justify-end gap-1">
      <UserDetailDialog user={user} />
      <SuspendToggleDialog user={user} disabled={locked} disabledReason={lockedReason} />
      <ChangeRoleDialog user={user} disabled={locked} disabledReason={lockedReason} />
      <DeleteUserDialog user={user} disabled={locked} disabledReason={lockedReason} />
    </div>
  );
}

const columnHelper = legacyCreateColumnHelper<AdminUser>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack v9 column defs are invariant over TValue
const columns: LegacyColumnDef<AdminUser, any>[] = [
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
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => {
      const role = info.getValue() as AdminUserRole;
      const meta = ROLE_META[role];
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            meta?.chip ?? "bg-muted text-muted-foreground"
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-muted-foreground")} />
          {meta?.label ?? role}
        </span>
      );
    },
  }),
  columnHelper.accessor("is_suspended", {
    header: "Status",
    cell: (info) => <StatusBadge suspended={!!info.getValue()} />,
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
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  }),
];

export default function UsersPage() {
  const { data: users, isLoading, isError } = useAllUsers();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(id);
  }, [search]);
  const searching = debounced !== search;

  const counts = useMemo(() => {
    const map = new Map<AdminUserRole, number>();
    for (const r of ADMIN_USER_ROLES) map.set(r, 0);
    for (const u of users ?? []) {
      if (ADMIN_USER_ROLES.includes(u.role as AdminUserRole)) {
        map.set(u.role as AdminUserRole, (map.get(u.role as AdminUserRole) ?? 0) + 1);
      }
    }
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = debounced.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = role === "all" || u.role === role;
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, debounced, role]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akun"
        title="Users"
        description={`Semua akun terdaftar di platform (${isLoading ? "…" : users?.length ?? 0}) — customer, owner, karyawan, dan admin.`}
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat daftar user. Coba muat ulang halaman.
        </div>
      )}

      <div className="stagger-children grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ADMIN_USER_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const Icon = meta.icon;
          return (
            <button
              key={r}
              onClick={() => setRole(role === r ? "all" : r)}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                role === r
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border/70 bg-card/60 hover:border-primary/20 hover:bg-primary/[0.03]"
              )}
              title={`Filter user dengan role ${meta.label}`}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  meta.chip,
                  role === r ? "border-primary/20" : "border-border/70"
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-lg font-bold tabular-nums">{isLoading ? "…" : counts.get(r)}</p>
                <p className="truncate text-[11px] font-medium text-muted-foreground">{meta.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          placeholder="Cari nama, email, atau nomor telepon..."
          value={search}
          onChange={setSearch}
          icon={<UsersIcon className="size-4" />}
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
                  <UsersIcon className="size-5" />
                </div>
                <p className="text-sm font-medium">Tidak ada user yang cocok dengan filter saat ini.</p>
              </div>
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}
