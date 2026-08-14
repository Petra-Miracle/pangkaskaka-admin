import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-primary/80 uppercase">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-base text-muted-foreground/90">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
