"use client";

import type { CSSProperties, MouseEvent } from "react";
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
import { Card } from "@heroui/react";
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

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }

  return (
    <Card
      className="glass-card glass-card-hover card-glow h-40 justify-between"
      style={{ "--glow-y": "-20%" } as CSSProperties}
      onMouseMove={handleMouseMove}
    >
      <Card.Header className="flex-row items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn("flex size-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br shadow-sm", accent)}>
          <Icon className="size-5" />
        </div>
      </Card.Header>
      <Card.Content className="gap-2">
        {value === undefined ? (
          <Spinner color="brand" size="sm" label="Memuat data..." />
        ) : (
          <>
            <div className="text-4xl leading-none font-bold tracking-tight text-primary tabular-nums">
              {format ? format(animated) : formatNumber(animated)}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <TrendChip value={trend} suffix={trendSuffix} />
              {footnote && <span className="text-xs text-muted-foreground">{footnote}</span>}
            </div>
          </>
        )}
      </Card.Content>
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
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </div>
      )}

      {/* KPI cards */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
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