import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Placeholder jujur untuk bagian modul Street Barber yang datanya belum ada di
// backend. Menyebutkan endpoint yang dibutuhkan supaya panel ini sekaligus jadi
// spec hidup — lihat BACKEND_ENDPOINTS_NEEDED.md §9.
export function PendingPanel({
  title,
  detail,
  endpoint,
}: {
  title: string;
  detail: string;
  endpoint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-5">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
          Menunggu endpoint backend
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
      {endpoint && (
        <code className="mt-0.5 w-fit max-w-full overflow-x-auto rounded-md border border-border bg-background px-2 py-1 font-mono text-xs whitespace-pre text-muted-foreground">
          {endpoint}
        </code>
      )}
    </div>
  );
}
