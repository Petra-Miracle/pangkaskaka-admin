"use client";

import { useMemo, useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import { Card } from "@heroui/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useAllUsers } from "@/lib/queries/users";
import { ADMIN_USER_ROLES, type AdminUser, type AdminUserRole } from "@/types/admin";
import { cn, formatRelativeTime } from "@/lib/utils";

const ROLE_META: Record<AdminUserRole, { label: string; chip: string; dot: string }> = {
  admin: { label: "Admin", chip: "bg-primary/10 text-primary", dot: "bg-primary" },
  owner: { label: "Pemilik toko", chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  karyawan: { label: "Karyawan", chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  customer: { label: "Customer", chip: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

function initialsOf(name: string | undefined) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  columnHelper.accessor("created_at", {
    header: "Terdaftar",
    cell: (info) => (
      <span className="text-muted-foreground" title={new Date(info.getValue() as string).toLocaleString("id-ID")}>
        {formatRelativeTime(info.getValue() as string)}
      </span>
    ),
  }),
];

export default function UsersPage() {
  const { data: users, isLoading, isError } = useAllUsers();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");

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
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = role === "all" || u.role === role;
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, role]);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ADMIN_USER_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(role === r ? "all" : r)}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all",
              role === r
                ? "border-primary/30 bg-primary/5 shadow-sm"
                : "border-border/70 bg-card/60 hover:border-primary/20 hover:bg-primary/[0.03]"
            )}
            title={`Filter user dengan role ${ROLE_META[r].label}`}
          >
            <span className={cn("size-2 shrink-0 rounded-full", ROLE_META[r].dot)} />
            <div className="min-w-0 leading-tight">
              <p className="text-lg font-bold tabular-nums">{isLoading ? "…" : counts.get(r)}</p>
              <p className="truncate text-[11px] font-medium text-muted-foreground">{ROLE_META[r].label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Input
            placeholder="Cari nama, email, atau nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          <UsersIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <Card className="glass-card overflow-hidden p-0">
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