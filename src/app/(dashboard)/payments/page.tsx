import { Clock, CreditCard, Plug, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@heroui/react";
import { CodeBlock } from "@/components/ui/code-block";
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

      <Card className="glass-card">
        <Card.Header>
          <div className="flex items-start gap-3">
            <div className="icon-tile size-10">
              <CreditCard className="size-4.5" />
            </div>
            <div>
              <Card.Title className="text-base text-foreground">Belum bisa dibangun</Card.Title>
              <Card.Description className="leading-relaxed text-muted-foreground">
                Tidak seperti Shops atau Recruitment yang bisa disiasati dari endpoint yang sudah ada, halaman
                ini genuinely butuh endpoint baru. Sudah dicek langsung ke API produksi — semua kemungkinan
                path (<code className="font-mono">/admin/payments</code>, <code className="font-mono">/payments</code>,{" "}
                <code className="font-mono">/admin/transactions</code>, dan beberapa varian lain) mengembalikan
                404, jadi tidak ada data untuk ditampilkan sama sekali.
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="stagger-children gap-5 text-sm">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-700 dark:text-amber-400">
            <Clock className="mt-0.5 size-4 shrink-0" />
            Kirim spesifikasi di bawah ke pemilik/pengelola repo backend (di luar proyek ini) — lihat juga
            AGENT_BRIEF.md bagian 4.
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Plug className="size-3.5 text-primary" />
              Endpoint yang dibutuhkan
            </p>
            <CodeBlock title="GET /admin/payments">GET /admin/payments?status=&amp;shop_id=&amp;search=&amp;page=&amp;size=</CodeBlock>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <CreditCard className="size-3.5 text-primary" />
              Bentuk response yang diusulkan
            </p>
            <CodeBlock title="response.json">{PAYMENTS_SPEC}</CodeBlock>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Webhook className="size-3.5 text-primary" />
              Opsional — log webhook Durianpay
            </p>
            <p className="text-muted-foreground">
              AGENT_BRIEF.md menyebut &ldquo;stuck webhooks&rdquo; terpisah dari histori transaksi — kemungkinan
              butuh endpoint kedua, misalnya{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">GET /admin/payments/webhooks?page=</code>,
              untuk log callback masuk dari Durianpay (bukan transaksinya sendiri).
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
