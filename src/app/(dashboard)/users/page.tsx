"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ADMIN_USER_ROLES } from "@/types/admin";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  owner: "secondary",
  karyawan: "secondary",
  customer: "outline",
};

export default function UsersPage() {
  const { data: users, isLoading, isError } = useAllUsers();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");

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
      <div>
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-primary md:text-4xl">Users</h1>
        <p className="text-base text-muted-foreground/90">
          Semua akun terdaftar di platform ({users?.length ?? "…"}) — customer, owner, karyawan, dan admin.
        </p>
      </div>

      {isError && <p className="text-sm text-destructive">Gagal memuat daftar user.</p>}

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
                {r}
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
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Tidak ada user yang cocok.
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[u.role] ?? "outline"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
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
