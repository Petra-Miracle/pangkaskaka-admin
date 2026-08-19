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
      <div className="min-w-0 animate-fade-up">
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
            <span className="size-1 rounded-full bg-primary" />
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 animate-fade-up [animation-delay:80ms]">
          {actions}
        </div>
      )}
    </div>
  );
}