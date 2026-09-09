import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Header bagian hemat-tinggi: teks kecil huruf kapital + garis 1px.
// Menggantikan blok besar (ikon + judul + subjudul) di dalam halaman.
export function SectionHeader({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h2 className="shrink-0 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
