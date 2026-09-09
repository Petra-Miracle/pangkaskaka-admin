"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useAnimatedNumber } from "@/lib/client-values";
import { formatCount, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type StatTrend = {
  value: number;
  /** "%" (default) atau teks unit lain, mis. " toko". */
  unit?: "percent" | "count";
  /** Teks kecil setelah angka tren, mis. "bulan ini". */
  caption?: string;
};

function TrendChip({ trend }: { trend: StatTrend }) {
  const positive = trend.value >= 0;
  const body =
    trend.unit === "count"
      ? `${positive ? "+" : "−"}${formatCount(Math.abs(trend.value))}`
      : formatPercent(trend.value, { signed: true });
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 tabular-nums",
          positive ? "text-success" : "text-danger"
        )}
      >
        {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {body}
      </span>
      {trend.caption && <span className="text-muted-foreground">· {trend.caption}</span>}
    </span>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  format = formatCount,
  trend,
  note,
  loading = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string | undefined;
  /** Pemformat untuk `value` numerik. Default: bilangan bulat id-ID. */
  format?: (n: number) => string;
  /** Indikator tren (hijau naik / merah turun). */
  trend?: StatTrend | null;
  /** Teks netral pengganti tren, mis. "data belum cukup dibandingkan". */
  note?: string;
  loading?: boolean;
}) {
  const numeric = typeof value === "number" ? value : 0;
  const animated = useAnimatedNumber(numeric, 900);
  const display =
    value === undefined
      ? "—"
      : typeof value === "number"
        ? format(animated)
        : value;

  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-500">
          <Icon className="size-4.5" />
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="skeleton h-9 w-24" />
      ) : (
        <div className="text-3xl leading-none font-bold tracking-tight text-ink-900 tabular-nums">
          {display}
        </div>
      )}
      <div className="min-h-4 text-xs">
        {loading ? null : trend ? (
          <TrendChip trend={trend} />
        ) : note ? (
          <span className="text-muted-foreground">{note}</span>
        ) : null}
      </div>
    </div>
  );
}

// Kartu tunggal bersekat — menggantikan 4 kartu KPI terpisah.
// Sekat 1px lewat trik `gap-px bg-border`: rapi di grid 2 kolom (sempit)
// maupun 4 kolom (lebar), tiap sel menutup dirinya dengan `bg-card`.
export function StatTileGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card card-glow overflow-hidden rounded-2xl p-0">
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">{children}</div>
    </div>
  );
}
