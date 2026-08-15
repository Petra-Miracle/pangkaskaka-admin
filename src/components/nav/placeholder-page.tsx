import { Clock, Construction } from "lucide-react";
import { Card } from "@heroui/react";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">{title}</h1>
        {blocked && <Badge variant="outline">Menunggu endpoint backend</Badge>}
      </div>
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
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-700 dark:text-amber-400">
              <Clock className="size-4 shrink-0" />
              Fitur ini menunggu endpoint yang belum tersedia di backend — lihat AGENT_BRIEF.md bagian 4.
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
