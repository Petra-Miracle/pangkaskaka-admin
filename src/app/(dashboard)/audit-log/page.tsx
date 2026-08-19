import { Clock, Database, History, Plug, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@heroui/react";
import { CodeBlock } from "@/components/ui/code-block";
import { PageHeader } from "@/components/nav/page-header";

const AUDIT_LOG_SPEC = `{
  "total": 0,
  "entries": [
    {
      "id": "string",
      "admin_id": "string",
      "admin_name": "string",
      "action": "shop.verify | shop.suspend | shop.document_review | recruitment.criteria_update | chat.close",
      "target_type": "shop | recruitment | chat_thread",
      "target_id": "string",
      "detail": { "decision": "approved", "note": "string" },
      "created_at": "ISO datetime"
    }
  ]
}`;

const WRITE_SITES = [
  "POST /admin/shops/{shop_id}/verify",
  "POST /admin/shops/{shop_id}/suspend",
  "POST /admin/shops/{shop_id}/documents/{doc_key}/review",
  "PUT /admin/recruitment/criteria",
  "POST /chat/threads/{shop_id}/close",
];

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Audit Log"
        description="Jejak siapa admin yang menyetujui/menolak/suspend apa, dan kapan."
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
              <History className="size-4.5" />
            </div>
            <div>
              <Card.Title className="text-base text-foreground">Belum bisa dibangun — dan lebih besar dari Payments/Bookings</Card.Title>
              <Card.Description className="leading-relaxed text-muted-foreground">
                Sudah dicek langsung ke API produksi — <code className="font-mono">/admin/audit-log</code>,{" "}
                <code className="font-mono">/admin/logs</code>, <code className="font-mono">/admin/activity</code>,
                dan beberapa varian lain semuanya 404. Bedanya dengan Payments/Bookings: di sana datanya sudah
                ada di database, backend cuma perlu endpoint baca. Audit log ini benar-benar belum ada dalam
                bentuk apa pun — setiap aksi admin di dashboard ini (approve/reject toko, suspend, review
                dokumen, ubah kriteria rekrutmen) hari ini tidak meninggalkan jejak siapa yang melakukannya sama
                sekali. Backend perlu mulai <em>menulis</em> log dulu sebelum ada apa pun untuk dibaca.
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
              <Database className="size-3.5 text-primary" />
              1. Koleksi baru + tulis log di setiap aksi admin
            </p>
            <p className="mb-2 text-muted-foreground">
              Koleksi <code className="font-mono">admin_audit_log</code>, ditulis dari dalam setiap endpoint di
              bawah ini (identitas admin sudah tersedia dari token JWT yang sedang dipakai):
            </p>
            <ul className="space-y-1.5">
              {WRITE_SITES.map((site) => (
                <li
                  key={site}
                  className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground"
                >
                  <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {site}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <Plug className="size-3.5 text-primary" />
              2. Endpoint baca yang dibutuhkan
            </p>
            <CodeBlock title="GET /admin/audit-log">
              GET /admin/audit-log?admin_id=&amp;action=&amp;target_type=&amp;page=&amp;size=
            </CodeBlock>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
              <History className="size-3.5 text-primary" />
              Bentuk response yang diusulkan
            </p>
            <CodeBlock title="response.json">{AUDIT_LOG_SPEC}</CodeBlock>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
