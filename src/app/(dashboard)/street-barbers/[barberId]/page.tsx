"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Ban, RotateCcw } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PendingPanel } from "@/components/street-barbers/pending-panel";
import {
  useActivateStreetBarber,
  useStreetBarber,
  useSuspendStreetBarber,
} from "@/lib/queries/street-barbers";
import { getSafeErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types/admin";

const TABS = [
  "Profil & dokumen",
  "Transaksi",
  "Keuangan & pencairan",
  "Performa & SOP",
  "Riwayat verifikasi",
  "Log aktivitas",
] as const;
type Tab = (typeof TABS)[number];

function initialsOf(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium break-words">{value}</span>
    </div>
  );
}

function SuspendDialog({ barber }: { barber: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const suspend = useSuspendStreetBarber();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" className="gap-2">
            <Ban className="size-3.5" /> Tangguhkan
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tangguhkan {barber.name}?</DialogTitle>
          <DialogDescription>
            StreetBarber tidak bisa login dan tidak menerima order sampai diaktifkan kembali.
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
          <Button
            variant="destructive"
            disabled={suspend.isPending}
            onClick={() =>
              suspend.mutate(
                { id: barber.id, reason: reason.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success(`${barber.name} ditangguhkan`);
                    setOpen(false);
                  },
                  onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menangguhkan akun")),
                }
              )
            }
            className="gap-2"
          >
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
      variant="outline"
      className="gap-2 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
      disabled={activate.isPending}
      onClick={() =>
        activate.mutate(barber.id, {
          onSuccess: () => toast.success(`${barber.name} diaktifkan kembali`),
          onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal mengaktifkan akun")),
        })
      }
    >
      {activate.isPending ? <Spinner color="success" size="xs" label="Mengaktifkan..." /> : <RotateCcw className="size-3.5" />}
      Aktifkan kembali
    </Button>
  );
}

export default function StreetBarberDetailPage({
  params,
}: {
  params: Promise<{ barberId: string }>;
}) {
  const { barberId } = use(params);
  const { data: barber, isLoading, isError } = useStreetBarber(barberId);
  const [tab, setTab] = useState<Tab>(TABS[0]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner color="brand" size="sm" label="Memuat detail Street Barber..." />
      </div>
    );
  }

  if (isError || !barber) {
    return (
      <div className="space-y-4">
        <Button variant="outline" nativeButton={false} className="gap-1.5" render={<Link href="/street-barbers"><ArrowLeft className="size-3.5" /> Kembali</Link>} />
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Street Barber tidak ditemukan atau gagal dimuat.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        className="gap-1.5"
        render={
          <Link href="/street-barbers">
            <ArrowLeft className="size-3.5" /> Semua Street Barber
          </Link>
        }
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border border-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-primary/12 to-primary/5 text-lg font-bold text-primary">
              {initialsOf(barber.name)}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{barber.name}</h1>
              {barber.is_suspended ? (
                <Badge variant="outline" className="border-transparent bg-destructive/10 font-medium text-destructive">
                  Ditangguhkan
                </Badge>
              ) : (
                <Badge variant="outline" className="border-transparent bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400">
                  Aktif
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {barber.phone || "Tanpa nomor"} · {barber.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {barber.is_suspended ? <ActivateButton barber={barber} /> : <SuspendDialog barber={barber} />}
        </div>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto">
        <div className="flex w-max gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "Profil & dokumen" && (
        <div className="space-y-4">
          <Card className="glass-card">
            <Card.Header>
              <Card.Title className="text-base text-foreground">Identitas & kontak</Card.Title>
            </Card.Header>
            <Card.Content>
              <Field label="Nama" value={barber.name || "—"} />
              <Field label="Email" value={barber.email || "—"} />
              <Field label="Telepon" value={barber.phone || "—"} />
              <Field label="Alamat" value={barber.address || "—"} />
              <Field
                label="Bergabung"
                value={barber.created_at ? new Date(barber.created_at).toLocaleString("id-ID") : "—"}
              />
              {barber.is_suspended && (
                <Field label="Alasan penangguhan" value={barber.suspended_reason || "Tidak dicatat"} />
              )}
            </Card.Content>
          </Card>
          <PendingPanel
            title="Rekening pencairan, kecamatan operasi, jam ketersediaan, dokumen + kedaluwarsa"
            detail="Rekening pencairan dan dokumen (KTP, sertifikat, foto alat) dengan tanggal unggah & kedaluwarsa, plus penandaan otomatis dokumen yang hampir kedaluwarsa. Data rekening ada di dompet/payout, dokumen ada di koleksi karyawan — belum ada satu endpoint SuperAdmin yang menggabungkannya per profil."
            endpoint={"GET /admin/street-barbers/{id}/profile"}
          />
          <PendingPanel
            title="Tindakan lain SuperAdmin"
            detail="Cabut akses permanen, minta verifikasi ulang dokumen, tandai untuk investigasi, tahan pencairan saat sengketa, proses pencairan manual, catat penyesuaian keuangan. Semua wajib menyertakan alasan tertulis dan tercatat di audit log. Suspend / aktifkan sudah berjalan lewat tombol di header."
            endpoint={"POST /admin/street-barbers/{id}/actions  (revoke | reverify | flag | hold-payout | manual-payout | adjust)"}
          />
        </div>
      )}

      {tab === "Transaksi" && (
        <PendingPanel
          title="Riwayat transaksi StreetBarber ini"
          detail="Daftar booking selesai/batal/refund dengan field lengkap sesuai Bagian D (booking_id, waktu WITA, pelanggan, alamat & kecamatan, layanan snapshot, gross/fee/net, status pembayaran & payout). Endpoint booking yang ada bersifat per-customer / per-owner, belum ada sudut pandang per-barberman untuk SuperAdmin."
          endpoint={"GET /admin/street-barbers/{id}/bookings?status=&range=&page="}
        />
      )}

      {tab === "Keuangan & pencairan" && (
        <PendingPanel
          title="Rekap keuangan & riwayat pencairan"
          detail="Rekap harian/mingguan/bulanan, saldo berjalan (balance_pending + balance_available dari wallet 'karyawan'), riwayat pencairan, dan status pencairan gagal beserta alasannya. Datanya ada di koleksi wallets/ledger_entries/payouts — butuh endpoint baca per barberman untuk SuperAdmin."
          endpoint={"GET /admin/street-barbers/{id}/wallet\nGET /admin/street-barbers/{id}/payouts"}
        />
      )}

      {tab === "Performa & SOP" && (
        <PendingPanel
          title="Metrik performa & kepatuhan SOP"
          detail="Rating rata-rata + tren, tingkat penyelesaian, tingkat pembatalan (dipisah barberman vs pelanggan), rata-rata waktu menerima order, rata-rata keterlambatan datang, jumlah komplain, dan catatan SOP (kerapian, kelengkapan alat). Semua ini agregat dari booking + review + catatan yang belum dikumpulkan di satu endpoint."
          endpoint={"GET /admin/street-barbers/{id}/performance?range="}
        />
      )}

      {tab === "Riwayat verifikasi" && (
        <PendingPanel
          title="Jejak verifikasi tahap 1 & 2"
          detail="Siapa memvalidasi berkas & kapan, siapa menguji keahlian & kapan, catatan penilaian, bukti (foto hasil potongan), dan hasil akhir. Sebagian data ada di koleksi karyawan (evaluated_at, total_score, bobot per kriteria, status), tapi endpoint yang ada (/shop-admin/karyawan) dibatasi ke admin toko yang bersangkutan — belum ada akses SuperAdmin lintas toko."
          endpoint={"GET /admin/street-barbers/{id}/verification-history"}
        />
      )}

      {tab === "Log aktivitas" && (
        <PendingPanel
          title="Log tindakan SuperAdmin terhadap akun ini"
          detail="Setiap tindakan SuperAdmin (tangguhkan, cabut akses, minta verifikasi ulang, tahan pencairan, penyesuaian keuangan) beserta alasannya. Bergantung pada koleksi audit_logs yang belum ada — lihat Bagian F / BACKEND_ENDPOINTS_NEEDED.md §4."
          endpoint={"GET /admin/audit-log?target_type=street_barber&target_id={id}"}
        />
      )}
    </div>
  );
}
