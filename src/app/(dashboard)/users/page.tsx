"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/nav/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllUsers } from "@/lib/queries/users";
import { ADMIN_USER_ROLES, type AdminUserRole } from "@/types/admin";
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

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="skeleton size-9 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-2.5 w-40 opacity-60" />
              </div>
            </div>
          </TableCell>
          <TableCell><div className="skeleton h-3 w-44" /></TableCell>
          <TableCell><div className="skeleton h-3 w-24" /></TableCell>
          <TableCell><div className="skeleton h-5 w-16 rounded-full" /></TableCell>
          <TableCell><div className="skeleton h-3 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

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
              "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all",
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari nama, email, atau nomor telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={role} onValueChange={(value) => setRole(value ?? "all")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Semua role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua role</SelectItem>
            {ADMIN_USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_META[r].label}
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
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <SkeletonRows />}

              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                    Tidak ada user yang cocok dengan filter saat ini.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtered.map((u) => (
                  <TableRow key={u.id} className="group transition-colors hover:bg-primary/[0.03]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-primary/10">
                          <AvatarFallback className="bg-gradient-to-br from-primary/12 to-primary/5 text-xs font-bold text-primary transition-transform group-hover:scale-105">
                            {initialsOf(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", ROLE_META[u.role as AdminUserRole]?.chip ?? "bg-muted text-muted-foreground")}>
                        <span className={cn("size-1.5 rounded-full", ROLE_META[u.role as AdminUserRole]?.dot ?? "bg-muted-foreground")} />
                        {ROLE_META[u.role as AdminUserRole]?.label ?? u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span title={new Date(u.created_at).toLocaleString("id-ID")}>
                        {formatRelativeTime(u.created_at)}
                      </span>
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
