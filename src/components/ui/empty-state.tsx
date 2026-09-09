import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Empty state yang mengarahkan tindakan — bukan sekadar "Tidak ada data".
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-sm flex-col items-center gap-2 px-4 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/60 text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
