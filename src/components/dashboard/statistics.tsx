"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";
import {
  AlertTriangle,
  BarChart3,
  ChartNoAxesColumnIncreasing,
  MapPin,
  PieChart,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { ApexChart } from "@/components/ui/apex-chart";
import { Card } from "@heroui/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getChartPalette } from "@/lib/chart-colors";
import { useAdminAnalytics } from "@/lib/queries/analytics";
import { useAllShops } from "@/lib/queries/shops";
import { useAllUsers } from "@/lib/queries/users";
import { ADMIN_USER_ROLES } from "@/types/admin";

const SHOP_FILTER_MODES = [
  { value: "category", label: "Kategori" },
  { value: "kecamatan", label: "Kecamatan / Alamat" },
  { value: "status", label: "Status verifikasi" },
] as const;
type ShopFilterMode = (typeof SHOP_FILTER_MODES)[number]["value"];

const STATUS_LABELS: Record<string, string> = {
  approved: "Disetujui",
  pending: "Menunggu",
  rejected: "Ditolak",
};

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  owner: "Pemilik toko",
  karyawan: "Karyawan",
  admin: "Admin",
};

// Addresses look like "Jl. ..., <kelurahan>, Kupang" — the API doesn't expose
// a dedicated kecamatan field, so the second-to-last comma-separated segment
// is used as a practical stand-in.
function extractArea(address: string) {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || "Tidak diketahui";
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ChartLoading({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner color="brand" size="sm" label={label} />
    </div>
  );
}

function ShopsByFilterChart() {
  const { data: shops, isLoading } = useAllShops();
  const [mode, setMode] = useState<ShopFilterMode>("category");
  const palette = getChartPalette();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const grouped = useMemo(() => {
    if (!shops) return [];
    const counts = new Map<string, number>();
    for (const shop of shops) {
      const key =
        mode === "category"
          ? shop.category || "Lainnya"
          : mode === "kecamatan"
            ? extractArea(shop.address)
            : (STATUS_LABELS[shop.verification_status] ?? shop.verification_status);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [shops, mode]);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: { show: false },
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 60 } },
    },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: [palette.chart1],
    fill: {
      type: "gradient",
      gradient: { shade: "light", type: "vertical", shadeIntensity: 0.35, opacityFrom: 1, opacityTo: 0.45 },
    },
    xaxis: {
      categories: grouped.map(([key]) => key),
      labels: { style: { colors: palette.muted } },
    },
    yaxis: { labels: { style: { colors: palette.muted } } },
    grid: { borderColor: palette.border },
    tooltip: { theme: dark ? "dark" : "light" },
    series: [{ name: "Jumlah toko", data: grouped.map(([, count]) => count) }],
  };

  return (
    <Card className="glass-card lg:col-span-2">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <BarChart3 className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Jumlah toko terdaftar</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">
              Menghitung setiap toko yang terdaftar di platform, difilter per {SHOP_FILTER_MODES.find((m) => m.value === mode)?.label.toLowerCase()}.
            </Card.Description>
          </div>
        </div>
        <Select value={mode} onValueChange={(value) => setMode((value as ShopFilterMode) ?? "category")}>
          <SelectTrigger className="w-44 shrink-0">
            <SelectValue>
              {(value: ShopFilterMode) => SHOP_FILTER_MODES.find((m) => m.value === value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SHOP_FILTER_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <ChartLoading label="Memuat data toko..." />
        ) : grouped.length === 0 ? (
          <ChartEmptyState label="Belum ada toko terdaftar." />
        ) : (
          <ApexChart options={options} />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Total {shops?.length ?? 0} toko terdaftar (disetujui + menunggu verifikasi).
        </p>
      </Card.Content>
    </Card>
  );
}

function UserRolesPieChart() {
  const { data: users, isLoading } = useAllUsers();
  const palette = getChartPalette();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const role of ADMIN_USER_ROLES) map.set(role, 0);
    for (const user of users ?? []) map.set(user.role, (map.get(user.role) ?? 0) + 1);
    return ADMIN_USER_ROLES.map((role) => [ROLE_LABELS[role] ?? role, map.get(role) ?? 0] as const);
  }, [users]);

  const total = counts.reduce((sum, [, count]) => sum + count, 0);

  const options: ApexOptions = {
    chart: {
      type: "pie",
      height: 260,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    labels: counts.map(([label]) => label),
    colors: [palette.chart5, palette.chart3, palette.chart1, palette.chart4],
    legend: { position: "bottom", labels: { colors: palette.muted } },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: { formatter: (val) => `${Number(val).toFixed(0)}%`, dropShadow: { enabled: false } },
    tooltip: { theme: dark ? "dark" : "light" },
    series: counts.map(([, count]) => count),
  };

  return (
    <Card className="glass-card">
      <Card.Header>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <PieChart className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Total pengguna per role</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">
              Total di seluruh platform — karyawan &amp; customer belum bisa dipecah per toko karena API belum menyimpan relasi karyawan ke toko.
            </Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <ChartLoading label="Memuat data pengguna..." />
        ) : total === 0 ? (
          <ChartEmptyState label="Belum ada pengguna terdaftar." />
        ) : (
          <ApexChart options={options} />
        )}
      </Card.Content>
    </Card>
  );
}

function AvgRatingRadialChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const rating = data?.health.avg_rating ?? 0;
  const pct = Math.max(0, Math.min(100, Math.round((rating / 5) * 100)));

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 260,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    series: [pct],
    labels: ["Rating"],
    colors: [palette.chart1],
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        track: {
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        },
        dataLabels: {
          value: {
            formatter: () => rating.toFixed(1),
            fontSize: "30px",
            fontWeight: 700,
            offsetY: 8,
            color: palette.foreground,
          },
          name: { show: false },
        },
      },
    },
  };

  return (
    <Card className="glass-card">
      <Card.Header>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <Star className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Rata-rata rating toko</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">Skala 0–5, dihitung dari seluruh toko di platform.</Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        {isLoading ? <ChartLoading label="Memuat rating..." /> : <ApexChart options={options} />}
      </Card.Content>
    </Card>
  );
}

function GrowthBarChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const customerGrowth = data?.kpi.customer_growth_pct ?? 0;
  const revenueGrowth = data?.kpi.revenue_growth_pct ?? 0;

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: { show: false },
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "45%" } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Number(val).toFixed(1)}%`,
      style: { colors: [palette.foreground], fontWeight: 600 },
    },
    legend: { show: false },
    colors: [
      customerGrowth >= 0 ? palette.success : palette.danger,
      revenueGrowth >= 0 ? palette.success : palette.danger,
    ],
    fill: { type: "solid" },
    xaxis: {
      categories: ["Pertumbuhan pelanggan", "Pertumbuhan pendapatan"],
      labels: { style: { colors: palette.muted } },
    },
    grid: { borderColor: palette.border },
    tooltip: { theme: dark ? "dark" : "light" },
    series: [{ name: "Growth %", data: [customerGrowth, revenueGrowth] }],
  };

  return (
    <Card className="glass-card">
      <Card.Header>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Pertumbuhan bulan ini</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">Persentase pertumbuhan pelanggan &amp; pendapatan dari `/analytics/admin`.</Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        {isLoading ? <ChartLoading label="Memuat data pertumbuhan..." /> : <ApexChart options={options} />}
      </Card.Content>
    </Card>
  );
}

function KecamatanDonutChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const distribution = data?.distribution ?? [];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 260,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    labels: distribution.map((d) => d.name),
    colors: [palette.chart5, palette.chart3, palette.chart2, palette.chart1, palette.chart4],
    legend: { position: "bottom", labels: { colors: palette.muted } },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: {
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      dropShadow: { enabled: false },
    },
    tooltip: { theme: dark ? "dark" : "light" },
    series: distribution.map((d) => d.count),
  };

  return (
    <Card className="glass-card">
      <Card.Header>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Distribusi toko per kecamatan</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">Dihitung langsung oleh backend (`distribution`), bukan hasil filter di halaman ini.</Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <ChartLoading label="Memuat distribusi..." />
        ) : distribution.length === 0 ? (
          <ChartEmptyState label="Belum ada data distribusi." />
        ) : (
          <ApexChart options={options} />
        )}
      </Card.Content>
    </Card>
  );
}

function AtRiskShopsList() {
  const { data, isLoading } = useAdminAnalytics();
  const shops = data?.health.warning_shops ?? [];

  return (
    <Card className="glass-card h-full">
      <Card.Header>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <AlertTriangle className="size-4.5" />
          </div>
          <div>
            <Card.Title className="text-base text-foreground">Toko berisiko</Card.Title>
            <Card.Description className="leading-relaxed text-muted-foreground">Rating toko turun lebih dari 0.5 dalam seminggu terakhir.</Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="flex h-full min-h-32 items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            <ShieldCheck className="size-4 shrink-0" />
            Tidak ada toko berisiko saat ini.
          </div>
        ) : (
          <ul className="space-y-2">
            {shops.map((shop, index) => (
              <li
                key={shop.id ?? shop.shop_id ?? index}
                className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-3.5 py-2.5 text-sm"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-xs font-bold text-warning">
                  {index + 1}
                </span>
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <span className="min-w-0 flex-1 truncate font-medium text-heading">
                  {shop.name ?? "Toko tidak diketahui"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}

export function StatisticsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground">
          <span className="icon-tile size-9">
            <ChartNoAxesColumnIncreasing className="size-4.5" />
          </span>
          Statistik
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Jumlah toko, pengguna, dan pertumbuhan platform.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <ShopsByFilterChart />
        <UserRolesPieChart />
        <AvgRatingRadialChart />
        <GrowthBarChart />
        <KecamatanDonutChart />
        <AtRiskShopsList />
      </div>
    </div>
  );
}
