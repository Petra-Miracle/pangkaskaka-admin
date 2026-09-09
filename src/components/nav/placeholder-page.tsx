import { Clock, Construction } from "lucide-react";
import { Card } from "@heroui/react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/nav/page-header";

export function PlaceholderPage({
  title,
  description,
  blocked,
}: {
  title: string;
  description: string;
  blocked?: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title={title}
        actions={blocked ? <Badge variant="neutral">Menunggu endpoint backend</Badge> : undefined}
      />
      <Card className="glass-card">
        <Card.Header>
          <div className="flex items-start gap-3">
            <div className="icon-tile size-10">
              <Construction className="size-4.5" />
            </div>
            <div>
              <Card.Title className="text-base text-foreground">Segera hadir</Card.Title>
              <Card.Description className="leading-relaxed text-muted-foreground">{description}</Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="gap-3 text-sm text-muted-foreground">
          <p>Halaman ini belum dibangun.</p>
          {blocked && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning-bg px-4 py-3 text-warning">
              <Clock className="size-4 shrink-0" />
              Fitur ini menunggu endpoint yang belum tersedia di backend.
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
