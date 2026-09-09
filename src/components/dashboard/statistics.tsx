"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  HelpCircle,
  LineChart,
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
import { SectionHeader } from "@/components/ui/section-header";
import { getChartPalette } from "@/lib/chart-colors";
import { useAdminAnalytics } from "@/lib/queries/analytics";
import { useAllShops } from "@/lib/queries/shops";
import { useAllUsers } from "@/lib/queries/users";
import { ADMIN_USER_ROLES } from "@/types/admin";
import { formatCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CHART_HEIGHT = 210;

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
  streetbarber: "StreetBarber",
  admin: "Admin",
  superadmin: "Superadmin",
};

// Addresses look like "Jl. ..., <kelurahan>, Kupang" — the API doesn't expose
// a dedicated kecamatan field, so the second-to-last comma-separated segment
// is used as a practical stand-in.
function extractArea(address: string) {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || "Tidak diketahui";
}

// Sumbu Y chart "Jumlah toko": tetap 0–40 dengan langkah 5 (0,5,10,…,40) supaya
// tampilannya konsisten & detail. Kalau data melampaui 40, batas atas naik ke
// kelipatan 10 berikutnya, langkah tetap = max/5 (selalu bilangan bulat).
function integerAxis(maxValue: number): { max: number; tickAmount: number } {
  const max = maxValue > 40 ? Math.ceil(maxValue / 10) * 10 : 40;
  return { max, tickAmount: max / 5 };
}

// Kosmetik chart yang seragam: tanpa toolbar, grid garis horizontal tipis saja,
// tooltip pil gelap.
function baseChartOptions(borderColor: string): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      fontFamily: "inherit",
      parentHeightOffset: 0,
      animations: { enabled: true, speed: 650 },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 8, top: 8 },
    },
    tooltip: { theme: "dark", style: { fontSize: "12px" } },
  };
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ChartLoading({ label }: { label: string }) {
  return (
    <div className="flex h-52 items-center justify-center">
      <Spinner color="brand" size="sm" label={label} />
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <button
      type="button"
      title={text}
      aria-label={text}
      className="shrink-0 rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <HelpCircle className="size-3.5" />
    </button>
  );
}

function ChartCard({
  icon: Icon,
  title,
  hint,
  action,
  footer,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-card card-glow", className)}>
      <Card.Header className="flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="icon-tile size-9 shrink-0">
            <Icon className="size-4" />
          </div>
          <Card.Title className="truncate text-sm font-semibold text-foreground">{title}</Card.Title>
          {hint && <InfoHint text={hint} />}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </Card.Header>
      <Card.Content className="min-w-0 pt-1">
        <div className="w-full">{children}</div>
      </Card.Content>
      {footer && (
        <Card.Footer className="-mx-4 -mb-4 mt-1 flex-wrap gap-2 border-t border-border/60 bg-muted/30 px-4 py-2">
          <span className="text-[11px] text-muted-foreground">{footer}</span>
        </Card.Footer>
      )}
    </Card>
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

  const maxCount = grouped.reduce((m, [, count]) => Math.max(m, count), 0);
  const { max: yMax, tickAmount } = integerAxis(maxCount);

  const options: ApexOptions = {
    ...baseChartOptions(palette.border),
    chart: {
      ...baseChartOptions(palette.border).chart,
      type: "area",
      height: CHART_HEIGHT,
    },
    stroke: { curve: "smooth", width: 3, lineCap: "round" },
    dataLabels: {
      enabled: true,
      offsetY: -10,
      formatter: (val) => Math.round(Number(val)).toString(),
      style: { fontSize: "11px", fontWeight: 700, colors: [palette.chart3] },
    },
    legend: { show: false },
    colors: [palette.chart1],
    markers: {
      size: 4,
      colors: [palette.background],
      strokeColors: palette.chart1,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: dark ? 0.5 : 0.4,
        opacityTo: 0.03,
        stops: [0, 95, 100],
      },
    },
    xaxis: {
      categories: grouped.map(([key]) => key),
      labels: {
        rotate: -35,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        style: { fontSize: "11px", colors: palette.muted },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: yMax,
      tickAmount,
      forceNiceScale: false,
      labels: {
        style: { colors: palette.muted, fontSize: "11px" },
        formatter: (val) => Math.round(val).toString(),
      },
    },
    series: [{ name: "Jumlah toko", data: grouped.map(([, count]) => count) }],
  };

  return (
    <ChartCard
      icon={LineChart}
      title="Jumlah toko terdaftar"
      hint={`Setiap toko yang terdaftar di platform, dikelompokkan per ${
        SHOP_FILTER_MODES.find((m) => m.value === mode)?.label.toLowerCase()
      }.`}
      action={
        <Select value={mode} onValueChange={(value) => setMode((value as ShopFilterMode) ?? "category")}>
          <SelectTrigger className="w-40">
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
      }
      footer={`Total ${formatCount(shops?.length ?? 0)} toko terdaftar (disetujui + menunggu verifikasi).`}
      className="lg:col-span-2"
    >
      {isLoading ? (
        <ChartLoading label="Memuat data toko..." />
      ) : grouped.length === 0 ? (
        <ChartEmptyState label="Belum ada toko terdaftar di platform." />
      ) : grouped.length === 1 ? (
        // Garis/area dengan satu titik tidak masuk akal — tampilkan angkanya.
        <div className="flex h-52 flex-col items-center justify-center gap-1">
          <span className="text-5xl font-bold tabular-nums text-ink-900">
            {formatCount(grouped[0][1])}
          </span>
          <span className="text-sm text-muted-foreground">toko · {grouped[0][0]}</span>
        </div>
      ) : (
        <ApexChart options={options} />
      )}
    </ChartCard>
  );
}

function UserRolesPieChart() {
  const { data: users, isLoading } = useAllUsers();
  const palette = getChartPalette();

  const roleCount = new Map<string, number>();
  for (const role of ADMIN_USER_ROLES) roleCount.set(role, 0);
  for (const user of users ?? []) roleCount.set(user.role, (roleCount.get(user.role) ?? 0) + 1);
  const counts = ADMIN_USER_ROLES.map(
    (role) => [ROLE_LABELS[role] ?? role, roleCount.get(role) ?? 0] as const
  );

  const total = counts.reduce((sum, [, count]) => sum + count, 0);

  const options: ApexOptions = {
    ...baseChartOptions(palette.border),
    chart: {
      ...baseChartOptions(palette.border).chart,
      type: "pie",
      height: CHART_HEIGHT,
    },
    labels: counts.map(([label]) => label),
    colors: [palette.chart1, palette.chart2, palette.chart3, palette.chart4, palette.chart5],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      offsetY: 2,
      itemMargin: { horizontal: 8, vertical: 2 },
      labels: { colors: palette.muted },
      markers: { width: 6, height: 6, offsetX: -2 },
    },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: {
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: { fontSize: "12px" },
      dropShadow: { enabled: false },
    },
    tooltip: { theme: "dark", y: { formatter: (val) => `${formatCount(val)} user` } },
    series: counts.map(([, count]) => count),
  };

  return (
    <ChartCard
      icon={PieChart}
      title="Total pengguna per role"
      hint="Total di seluruh platform. Karyawan & customer belum bisa dipecah per toko."
    >
      {isLoading ? (
        <ChartLoading label="Memuat data pengguna..." />
      ) : total === 0 ? (
        <ChartEmptyState label="Belum ada pengguna terdaftar." />
      ) : (
        <ApexChart options={options} />
      )}
    </ChartCard>
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
      height: CHART_HEIGHT,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 650 },
    },
    series: [pct],
    labels: ["Rating"],
    colors: [palette.chart1],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: { background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
        dataLabels: {
          value: {
            formatter: () => rating.toFixed(1),
            fontSize: "32px",
            fontWeight: 700,
            offsetY: 4,
            color: palette.foreground,
          },
          name: { show: false },
        },
      },
    },
    tooltip: { theme: "dark" },
  };

  return (
    <ChartCard
      icon={Star}
      title="Rata-rata rating toko"
      hint="Skala 0–5, dihitung dari seluruh toko di platform."
    >
      {isLoading ? <ChartLoading label="Memuat rating..." /> : <ApexChart options={options} />}
    </ChartCard>
  );
}

function GrowthBarChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const customerGrowth = data?.kpi.customer_growth_pct ?? 0;
  const revenueGrowth = data?.kpi.revenue_growth_pct ?? 0;

  const options: ApexOptions = {
    ...baseChartOptions(palette.border),
    chart: {
      ...baseChartOptions(palette.border).chart,
      type: "bar",
      height: CHART_HEIGHT,
    },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "38%" } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Number(val).toFixed(1)}%`,
      style: { colors: [palette.foreground], fontWeight: 600, fontSize: "11px" },
      offsetX: 4,
    },
    legend: { show: false },
    colors: [
      customerGrowth >= 0 ? palette.success : palette.danger,
      revenueGrowth >= 0 ? palette.success : palette.danger,
    ],
    fill: { type: "solid" },
    xaxis: {
      categories: ["Pertumbuhan pelanggan", "Pertumbuhan pendapatan"],
      labels: {
        style: { colors: palette.muted, fontSize: "11px" },
        formatter: (val) => `${Number(val).toFixed(1)}%`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    tooltip: { theme: "dark", y: { formatter: (val) => `${Number(val).toFixed(1)}%` } },
    series: [{ name: "Growth %", data: [customerGrowth, revenueGrowth] }],
  };

  return (
    <ChartCard
      icon={TrendingUp}
      title="Pertumbuhan bulan ini"
      hint="Persentase pertumbuhan pelanggan & pendapatan dibanding bulan lalu."
    >
      {isLoading ? <ChartLoading label="Memuat data pertumbuhan..." /> : <ApexChart options={options} />}
    </ChartCard>
  );
}

function KecamatanDonutChart() {
  const { data, isLoading } = useAdminAnalytics();
  const palette = getChartPalette();
  const distribution = data?.distribution ?? [];

  const options: ApexOptions = {
    ...baseChartOptions(palette.border),
    chart: {
      ...baseChartOptions(palette.border).chart,
      type: "donut",
      height: CHART_HEIGHT,
    },
    labels: distribution.map((d) => d.name),
    colors: [palette.chart1, palette.chart2, palette.chart3, palette.chart4, palette.chart5],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      offsetY: 2,
      itemMargin: { horizontal: 8, vertical: 2 },
      labels: { colors: palette.muted },
      markers: { width: 6, height: 6, offsetX: -2 },
    },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: {
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: { fontSize: "12px" },
      dropShadow: { enabled: false },
    },
    tooltip: { theme: "dark", y: { formatter: (val) => `${formatCount(val)} toko` } },
    series: distribution.map((d) => d.count),
  };

  return (
    <ChartCard
      icon={MapPin}
      title="Distribusi toko per kecamatan"
      hint="Dihitung langsung oleh backend, bukan hasil filter di halaman ini."
    >
      {isLoading ? (
        <ChartLoading label="Memuat distribusi..." />
      ) : distribution.length === 0 ? (
        <ChartEmptyState label="Belum ada data distribusi wilayah." />
      ) : (
        <ApexChart options={options} />
      )}
    </ChartCard>
  );
}

function AtRiskShopsList() {
  const { data, isLoading } = useAdminAnalytics();
  const shops = data?.health.warning_shops ?? [];

  return (
    <ChartCard
      icon={AlertTriangle}
      title="Toko berisiko"
      hint="Rating toko turun lebih dari 0.5 dalam seminggu terakhir."
      className="h-full"
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-11 w-full" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="flex h-full min-h-32 items-center justify-center gap-2 rounded-xl border border-success/20 bg-success-bg px-4 py-3 text-sm text-success">
          <ShieldCheck className="size-4 shrink-0" />
          Tidak ada toko berisiko saat ini.
        </div>
      ) : (
        <ul className="space-y-2">
          {shops.map((shop, index) => (
            <li
              key={shop.id ?? shop.shop_id ?? index}
              className="group flex items-center gap-3 rounded-xl border border-warning/20 bg-warning-bg px-3.5 py-2.5 text-sm transition-colors hover:border-warning/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-xs font-bold text-warning tabular-nums">
                {index + 1}
              </span>
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {shop.name ?? "Toko tidak diketahui"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export function StatisticsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader>Statistik</SectionHeader>
      <div className="stagger-children grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
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
