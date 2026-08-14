"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldAlert,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatisticsSection } from "@/components/dashboard/statistics";
import { useDashboardStats } from "@/lib/queries/dashboard";
import { useAdminAnalytics } from "@/lib/queries/analytics";
import { useAnimatedNumber, useGreeting, useStoredAdminUser, useTodayLabel } from "@/lib/client-values";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/admin";

function TrendChip({ value, suffix = "%" }: { value?: number; suffix?: string }) {
  if (value === undefined) return null;
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {positive ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

function KpiCard({
  label,
  icon: Icon,
  value,
  format,
  accent,
  trend,
  trendSuffix,
  footnote,
}: {
  label: string;
  icon: typeof Store;
  value?: number;
  format?: (n: number) => string;
  accent: string;
  trend?: number;
  trendSuffix?: string;
  footnote?: string;
}) {
  const animated = useAnimatedNumber(value ?? 0, 900);

  return (
    <Card interactive className="card-glow h-40 justify-between" style={{ "--glow-y": "-20%" } as CSSProperties}>
      <CardHeader className="flex-row items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn("flex size-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br shadow-sm", accent)}>
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {value === undefined ? (
          <Spinner color="brand" size="sm" label="Memuat data..." />
        ) : (
          <>
            <div className="text-4xl leading-none font-bold tracking-tight text-primary tabular-nums">
              {format ? format(animated) : formatNumber(animated)}
            </div>
            <div className="flex items-center gap-2">
              <TrendChip value={trend} suffix={trendSuffix} />
              {footnote && <span className="text-xs text-muted-foreground">{footnote}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardHomePage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: analytics } = useAdminAnalytics();
  const greeting = useGreeting();
  const today = useTodayLabel();
  const user = useStoredAdminUser();
  const adminName = user?.name?.split(" ")[0] ?? null;

  const kpi = analytics?.kpi;
  const s: DashboardStats | undefined = stats;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="hero-panel relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-primary/20 md:p-8">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">{today}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {greeting}
              {adminName ? `, ${adminName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-white/75 md:text-base">
              Ringkasan KPI seluruh platform PangkasKAKA. Gunakan{" "}
              <kbd className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">
                Ctrl<span className="mx-0.5">+</span>K
              </kbd>{" "}
              untuk pencarian cepat.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                nativeButton={false}
                className="border-white/25 bg-white/10 text-white shadow-none backdrop-blur-md hover:bg-white/20 hover:text-white"
                render={
                  <Link href="/verifications" className="gap-1.5">
                    <ShieldAlert className="size-4" />
                    Antrian verifikasi
                    {!isLoading && (s?.pending_verifications ?? 0) > 0 && (
                      <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold">
                        {s?.pending_verifications}
                      </span>
                    )}
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                API Production Online
              </span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3 md:min-w-72">
            {[
              { label: "Toko terdaftar", value: s?.total_shops, icon: Store },
              { label: "Pelanggan", value: s?.total_customers, icon: Users },
              { label: "Pendapatan hari ini", value: s?.revenue_today, icon: Wallet, money: true },
            ].map(({ label, value, icon: Icon, money }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md"
              >
                <Icon className="mb-2 size-4 text-white/70" />
                <p className="text-lg leading-tight font-bold tabular-nums">
                  {value === undefined ? "…" : money ? formatRupiah(value) : formatNumber(value)}
                </p>
                <p className="text-[11px] font-medium text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <KpiCard
          label="Total shops"
          icon={Store}
          value={s?.total_shops}
          accent="from-primary/15 to-primary/5 text-primary"
          trend={kpi?.new_shops_month}
          trendSuffix=" bulan ini"
        />
        <KpiCard
          label="Pending verifications"
          icon={ShieldAlert}
          value={s?.pending_verifications}
          accent="from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400"
          footnote="menunggu review"
        />
        <KpiCard
          label="Total customers"
          icon={Users}
          value={s?.total_customers}
          accent="from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"
          trend={kpi?.customer_growth_pct}
          footnote="vs bulan lalu"
        />
        <KpiCard
          label="Revenue today"
          icon={Wallet}
          value={s?.revenue_today}
          format={formatRupiah}
          accent="from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400"
          trend={kpi?.revenue_growth_pct}
          footnote="vs bulan lalu"
        />
      </div>

      <StatisticsSection />
    </div>
  );
}