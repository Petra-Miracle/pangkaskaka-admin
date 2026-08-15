import { Clock, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/nav/page-header";

const PAYMENTS_SPEC = `{
  "total": 0,
  "payments": [
    {
      "id": "string",
      "shop_id": "string",
      "shop_name": "string",
      "booking_id": "string",
      "amount": 0,
      "status": "pending | paid | failed | expired | refunded",
      "method": "string",
      "durianpay_reference": "string",
      "created_at": "ISO datetime",
      "paid_at": "ISO datetime | null",
      "failure_reason": "string | null"
    }
  ]
}`;

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Payments"
        description="Transaksi, webhook, dan riwayat Durianpay per toko."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Clock className="size-3" />
            Menunggu endpoint backend
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="icon-tile size-10">
              <CreditCard className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">Belum bisa dibangun</CardTitle>
              <CardDescription>
                Tidak seperti Shops atau Recruitment yang bisa disiasati dari endpoint yang sudah ada, halaman
                ini genuinely butuh endpoint baru. Sudah dicek langsung ke API produksi — semua kemungkinan
                path (<code className="font-mono">/admin/payments</code>, <code className="font-mono">/payments</code>,{" "}
                <code className="font-mono">/admin/transactions</code>, dan beberapa varian lain) mengembalikan
                404, jadi tidak ada data untuk ditampilkan sama sekali.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-700 dark:text-amber-400">
            <Clock className="mt-0.5 size-4 shrink-0" />
            Kirim spesifikasi di bawah ke pemilik/pengelola repo backend (di luar proyek ini) — lihat juga
            AGENT_BRIEF.md bagian 4.
          </div>

          <div>
            <p className="mb-2 font-semibold text-foreground">Endpoint yang dibutuhkan</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs">
              GET /admin/payments?status=&amp;shop_id=&amp;search=&amp;page=&amp;size=
            </pre>
          </div>

          <div>
            <p className="mb-2 font-semibold text-foreground">Bentuk response yang diusulkan</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre">
              {PAYMENTS_SPEC}
            </pre>
          </div>

          <div>
            <p className="mb-2 font-semibold text-foreground">Opsional — log webhook Durianpay</p>
            <p className="text-muted-foreground">
              AGENT_BRIEF.md menyebut &ldquo;stuck webhooks&rdquo; terpisah dari histori transaksi — kemungkinan
              butuh endpoint kedua, misalnya{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">GET /admin/payments/webhooks?page=</code>,
              untuk log callback masuk dari Durianpay (bukan transaksinya sendiri).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
