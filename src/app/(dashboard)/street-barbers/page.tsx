"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, Download, ExternalLink, RotateCcw, Scissors, ShieldCheck, UserX } from "lucide-react";
import { Card } from "@heroui/react";
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
import { SearchBox } from "@/components/ui/search-box";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/nav/page-header";
import { DataTable, legacyCreateColumnHelper } from "@/components/ui/data-table";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { PendingPanel } from "@/components/street-barbers/pending-panel";
import {
  useActivateStreetBarber,
  useStreetBarbers,
  useSuspendStreetBarber,
} from "@/lib/queries/street-barbers";
import { getSafeErrorMessage } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AdminUser } from "@/types/admin";

function initialsOf(name?: string) {
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

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
      <p className={cn("text-2xl font-bold tabular-nums", tone ?? "text-foreground")}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function SuspendDialog({ barber }: { barber: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const suspend = useSuspendStreetBarber();

  function handleSuspend() {
    suspend.mutate(
      { id: barber.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${barber.name} ditangguhkan`);
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
          <DialogTitle>Tangguhkan {barber.name}?</DialogTitle>
          <DialogDescription>
            StreetBarber tidak bisa login dan tidak menerima order panggilan sampai diaktifkan kembali.
            Riwayat dan datanya tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Alasan penangguhan (opsional)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button variant="destructive" disabled={suspend.isPending} onClick={handleSuspend} className="gap-2">
            {suspend.isPending && <Spinner color="danger" size="xs" label="Menangguhkan..." />}
            Tangguhkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivateButton({ barber }: { barber: AdminUser }) {
  const activate = useActivateStreetBarber();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-8 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
      aria-label="Aktifkan kembali"
      title="Aktifkan kembali"
      disabled={activate.isPending}
      onClick={() =>
        activate.mutate(barber.id, {
          onSuccess: () => toast.success(`${barber.name} diaktifkan kembali`),
          onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal mengaktifkan akun")),
        })
      }
    >
      {activate.isPending ? <Spinner color="success" size="xs" label="Mengaktifkan..." /> : <RotateCcw className="size-3.5" />}
    </Button>
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
  columnHelper.accessor("is_suspended", {
    header: "Status",
    cell: (info) => <StatusBadge suspended={!!info.getValue()} />,
  }),
  columnHelper.accessor("created_at", {
    header: "Bergabung",
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
      <div className="flex justify-end gap-1">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          className="gap-1.5"
          render={
            <Link href={`/street-barbers/${row.original.id}`}>
              <ExternalLink className="size-3.5" />
              Detail
            </Link>
          }
        />
        {row.original.is_suspended ? <ActivateButton barber={row.original} /> : <SuspendDialog barber={row.original} />}
      </div>
    ),
  }),
];

function exportCsv(rows: AdminUser[]) {
  const header = ["Nama", "Email", "Telepon", "Status", "Bergabung"];
  const body = rows.map((r) => [
    r.name ?? "",
    r.email ?? "",
    r.phone ?? "",
    r.is_suspended ? "Ditangguhkan" : "Aktif",
    r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `street-barbers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StreetBarbersPage() {
  const { data: barbers, isLoading, isError } = useStreetBarbers();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(id);
  }, [search]);
  const searching = debounced !== search;

  const counts = useMemo(() => {
    const list = barbers ?? [];
    const suspended = list.filter((b) => b.is_suspended).length;
    return { total: list.length, suspended, active: list.length - suspended };
  }, [barbers]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return (barbers ?? []).filter((b) => {
      const matchesStatus =
        status === "all" || (status === "suspended" ? b.is_suspended : !b.is_suspended);
      const matchesSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [barbers, debounced, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Armada"
        title="Street Barber"
        description={`Tukang pangkas panggilan ke rumah — mandiri, di bawah pengawasan langsung SuperAdmin (${isLoading ? "…" : counts.total}).`}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            disabled={!filtered.length}
            onClick={() => exportCsv(filtered)}
          >
            <Download className="size-4" />
            Ekspor CSV
          </Button>
        }
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat daftar Street Barber. Coba muat ulang halaman.
        </div>
      )}

      {/* Lapis 1 — ringkasan armada */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <Scissors className="size-3.5" /> Ringkasan armada
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Total terdaftar" value={isLoading ? "…" : counts.total} />
          <StatTile
            label="Aktif"
            value={isLoading ? "…" : counts.active}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatTile
            label="Ditangguhkan"
            value={isLoading ? "…" : counts.suspended}
            tone={counts.suspended > 0 ? "text-destructive" : "text-foreground"}
          />
        </div>
        <PendingPanel
          title="Metrik operasional & grafik armada"
          detail="Aktif 7 hari terakhir, sedang online, dana belum dicairkan, tren GMV armada, sebaran per kecamatan vs permintaan, dan sebaran rating — semua butuh agregat dari booking, dompet, dan lokasi live yang belum diekspos ke SuperAdmin."
          endpoint={"GET /admin/street-barbers/summary\nGET /admin/street-barbers?range=30d  (kolom agregat per barberman)"}
        />
      </section>

      {/* Lapis 2 — daftar barberman */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <ShieldCheck className="size-3.5" /> Daftar Street Barber
        </h2>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <UserX className="mt-0.5 size-3.5 shrink-0" />
          <p className="leading-relaxed">
            Kolom operasional (kecamatan basis, order 30 hari, tingkat pembatalan, rating, GMV, saldo
            belum dicairkan, terakhir aktif) dan filter flag risiko menunggu endpoint backend — lihat
            spec di <code className="font-mono">BACKEND_ENDPOINTS_NEEDED.md §9</code>. Yang tampil di
            bawah adalah data akun yang sudah tersedia.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBox
            placeholder="Cari nama, email, atau telepon..."
            value={search}
            onChange={setSearch}
            icon={<Scissors className="size-4" />}
            busy={isLoading || searching}
          />
          <Select value={status} onValueChange={(v) => setStatus((v as typeof status) ?? "all")}>
            <SelectTrigger className="sm:w-44">
              <SelectValue>
                {(v: typeof status) =>
                  v === "all" ? "Semua status" : v === "active" ? "Aktif" : "Ditangguhkan"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="suspended">Ditangguhkan</SelectItem>
            </SelectContent>
          </Select>
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
                    <Scissors className="size-5" />
                  </div>
                  <p className="text-sm font-medium">
                    {barbers?.length === 0
                      ? "Belum ada Street Barber terdaftar. Antrean pendaftaran ada di menu Verifications."
                      : "Tidak ada Street Barber yang cocok dengan filter saat ini."}
                  </p>
                </div>
              }
            />
          </Card.Content>
        </Card>
      </section>
    </div>
  );
}
