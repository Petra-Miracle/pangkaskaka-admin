"use client";

import { useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import {
  AlertTriangle,
  BarChart3,
  MapPin,
  PieChart,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { ApexChart } from "@/components/ui/apex-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    chart: { type: "bar", height: 260, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "55%", distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: [
      palette.chart1,
      palette.chart2,
      palette.chart3,
      palette.chart4,
      palette.chart5,
      palette.success,
      palette.warning,
      palette.purple,
    ],
    xaxis: {
      categories: grouped.map(([key]) => key),
      labels: { style: { colors: palette.muted } },
    },
    yaxis: { labels: { style: { colors: palette.muted } } },
    grid: { borderColor: palette.border },
    tooltip: { theme: "light" },
    series: [{ name: "Jumlah toko", data: grouped.map(([, count]) => count) }],
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <BarChart3 className="size-4.5" />
          </div>
          <div>
            <CardTitle>Jumlah toko terdaftar</CardTitle>
            <CardDescription>
              Menghitung setiap toko yang terdaftar di platform, difilter per {SHOP_FILTER_MODES.find((m) => m.value === mode)?.label.toLowerCase()}.
            </CardDescription>
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
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

function UserRolesPieChart() {
  const { data: users, isLoading } = useAllUsers();
  const palette = getChartPalette();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const role of ADMIN_USER_ROLES) map.set(role, 0);
    for (const user of users ?? []) map.set(user.role, (map.get(user.role) ?? 0) + 1);
    return ADMIN_USER_ROLES.map((role) => [ROLE_LABELS[role] ?? role, map.get(role) ?? 0] as const);
  }, [users]);

  const total = counts.reduce((sum, [, count]) => sum + count, 0);

  const options: ApexOptions = {
    chart: { type: "pie", height: 260, fontFamily: "inherit" },
    labels: counts.map(([label]) => label),
    colors: [palette.chart2, palette.success, palette.warning, palette.purple],
    legend: { position: "bottom", labels: { colors: palette.muted } },
    tooltip: { theme: "light" },
    series: counts.map(([, count]) => count),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <PieChart className="size-4.5" />
          </div>
          <div>
            <CardTitle>Total pengguna per role</CardTitle>
            <CardDescription>
              Total di seluruh platform — karyawan &amp; customer belum bisa dipecah per toko karena API belum menyimpan relasi karyawan ke toko.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartLoading label="Memuat data pengguna..." />
        ) : total === 0 ? (
          <ChartEmptyState label="Belum ada pengguna terdaftar." />
        ) : (
          <ApexChart options={options} />
        )}
      </CardContent>
    </Card>
  );
}

function AvgRatingRadialChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const rating = data?.health.avg_rating ?? 0;
  const pct = Math.max(0, Math.min(100, Math.round((rating / 5) * 100)));

  const options: ApexOptions = {
    chart: { type: "radialBar", height: 260, fontFamily: "inherit" },
    series: [pct],
    labels: ["Rating"],
    colors: [palette.chart2],
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        dataLabels: {
          value: {
            formatter: () => rating.toFixed(1),
            fontSize: "28px",
            fontWeight: 700,
            offsetY: 8,
          },
          name: { show: false },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <Star className="size-4.5" />
          </div>
          <div>
            <CardTitle>Rata-rata rating toko</CardTitle>
            <CardDescription>Skala 0–5, dihitung dari seluruh toko di platform.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading label="Memuat rating..." /> : <ApexChart options={options} />}
      </CardContent>
    </Card>
  );
}

function GrowthBarChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const customerGrowth = data?.kpi.customer_growth_pct ?? 0;
  const revenueGrowth = data?.kpi.revenue_growth_pct ?? 0;

  const options: ApexOptions = {
    chart: { type: "bar", height: 260, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, distributed: true, barHeight: "45%" } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Number(val).toFixed(1)}%`,
    },
    legend: { show: false },
    colors: [
      customerGrowth >= 0 ? palette.success : palette.danger,
      revenueGrowth >= 0 ? palette.success : palette.danger,
    ],
    xaxis: {
      categories: ["Pertumbuhan pelanggan", "Pertumbuhan pendapatan"],
      labels: { style: { colors: palette.muted } },
    },
    grid: { borderColor: palette.border },
    tooltip: { theme: "light" },
    series: [{ name: "Growth %", data: [customerGrowth, revenueGrowth] }],
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <CardTitle>Pertumbuhan bulan ini</CardTitle>
            <CardDescription>Persentase pertumbuhan pelanggan &amp; pendapatan dari `/analytics/admin`.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading label="Memuat data pertumbuhan..." /> : <ApexChart options={options} />}
      </CardContent>
    </Card>
  );
}

function KecamatanDonutChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const distribution = data?.distribution ?? [];

  const options: ApexOptions = {
    chart: { type: "donut", height: 260, fontFamily: "inherit" },
    labels: distribution.map((d) => d.name),
    colors: [palette.chart1, palette.chart2, palette.chart3, palette.chart4, palette.chart5],
    legend: { position: "bottom", labels: { colors: palette.muted } },
    dataLabels: { formatter: (val) => `${Number(val).toFixed(0)}%` },
    tooltip: { theme: "light" },
    series: distribution.map((d) => d.count),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <CardTitle>Distribusi toko per kecamatan</CardTitle>
            <CardDescription>Dihitung langsung oleh backend (`distribution`), bukan hasil filter di halaman ini.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartLoading label="Memuat distribusi..." />
        ) : distribution.length === 0 ? (
          <ChartEmptyState label="Belum ada data distribusi." />
        ) : (
          <ApexChart options={options} />
        )}
      </CardContent>
    </Card>
  );
}

function AtRiskShopsList() {
  const { data, isLoading } = useAdminAnalytics();
  const shops = data?.health.warning_shops ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile size-10">
            <AlertTriangle className="size-4.5" />
          </div>
          <div>
            <CardTitle>Toko berisiko</CardTitle>
            <CardDescription>Rating toko turun lebih dari 0.5 dalam seminggu terakhir.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner color="dark" size="xs" />
            Memuat...
          </div>
        ) : shops.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            <ShieldCheck className="size-4 shrink-0" />
            Tidak ada toko berisiko saat ini.
          </div>
        ) : (
          <ul className="space-y-2">
            {shops.map((shop, index) => (
              <li
                key={shop.id ?? shop.shop_id ?? index}
                className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-2.5 text-sm"
              >
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <span className="font-medium text-heading">{shop.name ?? "Toko tidak diketahui"}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StatisticsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-heading">Statistik</h2>
        <p className="text-sm text-muted-foreground">
          Jumlah toko, pengguna, dan pertumbuhan platform — sebagian besar bisa difilter per toko.
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
