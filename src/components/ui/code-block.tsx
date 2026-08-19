import type { ReactNode } from "react";

export function CodeBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/50">
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/70 px-3 py-2">
        <span className="size-2 rounded-full bg-destructive/50" />
        <span className="size-2 rounded-full bg-warning/50" />
        <span className="size-2 rounded-full bg-success/50" />
        {title && <span className="ml-2 truncate font-mono text-[10px] text-muted-foreground">{title}</span>}
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}
