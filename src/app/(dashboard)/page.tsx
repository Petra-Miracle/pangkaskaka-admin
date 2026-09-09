"use client";

import { ShieldAlert, Store, Users, Wallet } from "lucide-react";
import { StatTile, StatTileGroup, type StatTrend } from "@/components/ui/stat-tile";
import { StatisticsSection } from "@/components/dashboard/statistics";
import { useDashboardStats } from "@/lib/queries/dashboard";
import { useAdminAnalytics } from "@/lib/queries/analytics";
import { formatRupiah, hasEnoughSample } from "@/lib/utils";
import type { DashboardStats } from "@/types/admin";

const NOT_ENOUGH_SAMPLE = "data belum cukup dibandingkan";

export default function DashboardHomePage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: analytics } = useAdminAnalytics();

  const kpi = analytics?.kpi;
  const s: DashboardStats | undefined = stats;

  // Perbandingan bulan-ke-bulan hanya bermakna kalau basis pelanggannya cukup.
  const comparable = hasEnoughSample(s?.total_customers);

  const shopsTrend: StatTrend | undefined =
    kpi?.new_shops_month !== undefined
      ? { value: kpi.new_shops_month, unit: "count", caption: "bulan ini" }
      : undefined;

  const customersTrend: StatTrend | undefined =
    comparable && kpi?.customer_growth_pct !== undefined
      ? { value: kpi.customer_growth_pct, caption: "vs bulan lalu" }
      : undefined;

  const revenueTrend: StatTrend | undefined =
    comparable && kpi?.revenue_growth_pct !== undefined
      ? { value: kpi.revenue_growth_pct, caption: "vs bulan lalu" }
      : undefined;

  return (
    <div className="space-y-6">
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </div>
      )}

      <StatTileGroup>
        <StatTile
          icon={Store}
          label="Total toko"
          value={s?.total_shops}
          loading={isLoading}
          trend={shopsTrend}
        />
        <StatTile
          icon={ShieldAlert}
          label="Verifikasi tertunda"
          value={s?.pending_verifications}
          loading={isLoading}
          note="menunggu review"
        />
        <StatTile
          icon={Users}
          label="Total pelanggan"
          value={s?.total_customers}
          loading={isLoading}
          trend={customersTrend}
          note={customersTrend ? undefined : NOT_ENOUGH_SAMPLE}
        />
        <StatTile
          icon={Wallet}
          label="Pendapatan hari ini"
          value={s?.revenue_today}
          format={formatRupiah}
          loading={isLoading}
          trend={revenueTrend}
          note={revenueTrend ? undefined : "vs bulan lalu"}
        />
      </StatTileGroup>

      <StatisticsSection />
    </div>
  );
}
