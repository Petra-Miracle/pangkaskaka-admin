import { CalendarClock, Clock, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@heroui/react";
import { CodeBlock } from "@/components/ui/code-block";
import { PageHeader } from "@/components/nav/page-header";

const BOOKINGS_SPEC = `{
  "total": 0,
  "bookings": [
    {
      "id": "string",
      "shop_id": "string",
      "shop_name": "string",
      "customer_id": "string",
      "customer_name": "string",
      "karyawan_id": "string | null",
      "karyawan_name": "string | null",
      "service": "string",
      "status": "pending | confirmed | completed | cancelled | no_show",
      "scheduled_at": "ISO datetime",
      "created_at": "ISO datetime",
      "amount": 0
    }
  ]
}`;

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Bookings"
        description="Pencarian booking lintas toko untuk dukungan sengketa (dispute)."
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
              <CalendarClock className="size-4.5" />
            </div>
            <div>
              <Card.Title className="text-base text-foreground">Belum bisa dibangun</Card.Title>
              <Card.Description className="leading-relaxed text-muted-foreground">
                Sudah dicek langsung ke API produksi. <code className="font-mono">GET /bookings</code> memang
                ada dan mengembalikan <code className="font-mono">200</code>, tapi itu endpoint per-user yang
                sama dipakai mobile app (customer melihat booking-nya sendiri, owner melihat booking tokonya) —
                untuk akun admin ini hasilnya selalu kosong karena admin bukan customer maupun owner toko mana
                pun. Tidak ada parameter atau endpoint terpisah yang mengizinkan admin melihat booking lintas
                toko; <code className="font-mono">/admin/bookings</code>,{" "}
                <code className="font-mono">/shops/{"{id}"}/bookings</code>, dan beberapa varian lain semuanya
                404.
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
            <CodeBlock title="GET /admin/bookings">GET /admin/bookings?shop_id=&amp;status=&amp;search=&amp;page=&amp;size=</CodeBlock>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <CalendarClock className="size-3.5 text-primary" />
              Bentuk response yang diusulkan
            </p>
            <CodeBlock title="response.json">{BOOKINGS_SPEC}</CodeBlock>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
