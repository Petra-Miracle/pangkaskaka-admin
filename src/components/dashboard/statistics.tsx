"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";
import type { LucideIcon } from "lucide-react";
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
import type { ReactNode } from "react";
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
import { cn } from "@/lib/utils";

const CHART_HEIGHT = 300;

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

function ChartCard({
  icon: Icon,
  title,
  description,
  action,
  footer,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-card card-glow", className)}>
      <Card.Header className="flex-col items-stretch gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="icon-tile size-10 shrink-0">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <Card.Title className="text-base text-foreground">{title}</Card.Title>
            {description && (
              <Card.Description className="mt-0.5 line-clamp-2 max-w-md leading-relaxed text-muted-foreground">
                {description}
              </Card.Description>
            )}
          </div>
        </div>
        {action && <div className="shrink-0 lg:pt-0.5">{action}</div>}
      </Card.Header>
      <Card.Content className="min-w-0 pt-2">
        <div className="w-full">{children}</div>
      </Card.Content>
      {footer && (
        <Card.Footer className="-mx-4 -mb-4 flex-wrap gap-2 border-t border-border/60 bg-muted/30 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">{footer}</span>
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

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: CHART_HEIGHT,
      toolbar: { show: false },
      fontFamily: "inherit",
      parentHeightOffset: 0,
      animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 60 } },
    },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "52%" } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: [palette.chart1],
    fill: {
      type: "gradient",
      gradient: { shade: "light", type: "vertical", shadeIntensity: 0.3, opacityFrom: 1, opacityTo: 0.45 },
    },
    grid: { borderColor: palette.border, padding: { left: 8, right: 8 } },
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
      labels: {
        style: { colors: palette.muted, fontSize: "11px" },
        formatter: (val) => Math.round(val).toString(),
      },
    },
    tooltip: { theme: dark ? "dark" : "light" },
    series: [{ name: "Jumlah toko", data: grouped.map(([, count]) => count) }],
  };

  return (
    <ChartCard
      icon={BarChart3}
      title="Jumlah toko terdaftar"
      description={`Menghitung setiap toko yang terdaftar di platform, difilter per ${
        SHOP_FILTER_MODES.find((m) => m.value === mode)?.label.toLowerCase()
      }.`}
      action={
        <Select value={mode} onValueChange={(value) => setMode((value as ShopFilterMode) ?? "category")}>
          <SelectTrigger className="w-full lg:w-44">
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
      footer={`Total ${shops?.length ?? 0} toko terdaftar (disetujui + menunggu verifikasi).`}
      className="lg:col-span-2"
    >
      {isLoading ? (
        <ChartLoading label="Memuat data toko..." />
      ) : grouped.length === 0 ? (
        <ChartEmptyState label="Belum ada toko terdaftar." />
      ) : (
        <ApexChart options={options} />
      )}
    </ChartCard>
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
      height: CHART_HEIGHT,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    labels: counts.map(([label]) => label),
    colors: [palette.chart5, palette.chart3, palette.chart1, palette.chart4],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      offsetY: 2,
      itemMargin: { horizontal: 10, vertical: 3 },
      labels: { colors: palette.muted },
      markers: { width: 6, height: 6, offsetX: -2 },
    },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: {
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: { fontSize: "12px" },
      dropShadow: { enabled: false },
    },
    tooltip: {
      theme: dark ? "dark" : "light",
      y: { formatter: (val) => `${val} user` },
    },
    series: counts.map(([, count]) => count),
  };

  return (
    <ChartCard
      icon={PieChart}
      title="Total pengguna per role"
      description="Total di seluruh platform — karyawan & customer belum bisa dipecah per toko karena API belum menyimpan relasi karyawan ke toko."
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
      animations: { enabled: true, speed: 700 },
    },
    series: [pct],
    labels: ["Rating"],
    colors: [palette.chart1],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: {
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        },
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
    tooltip: { theme: dark ? "dark" : "light" },
  };

  return (
    <ChartCard
      icon={Star}
      title="Rata-rata rating toko"
      description="Skala 0–5, dihitung dari seluruh toko di platform."
    >
      {isLoading ? <ChartLoading label="Memuat rating..." /> : <ApexChart options={options} />}
    </ChartCard>
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
      height: CHART_HEIGHT,
      toolbar: { show: false },
      fontFamily: "inherit",
      parentHeightOffset: 0,
      animations: { enabled: true, speed: 700 },
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
    grid: { borderColor: palette.border, padding: { left: 8, right: 16 } },
    xaxis: {
      categories: ["Pertumbuhan pelanggan", "Pertumbuhan pendapatan"],
      labels: {
        style: { colors: palette.muted, fontSize: "11px" },
        formatter: (val) => `${Number(val).toFixed(1)}%`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    tooltip: {
      theme: dark ? "dark" : "light",
      y: { formatter: (val) => `${Number(val).toFixed(1)}%` },
    },
    series: [{ name: "Growth %", data: [customerGrowth, revenueGrowth] }],
  };

  return (
    <ChartCard
      icon={TrendingUp}
      title="Pertumbuhan bulan ini"
      description="Persentase pertumbuhan pelanggan & pendapatan dari `/analytics/admin`."
    >
      {isLoading ? <ChartLoading label="Memuat data pertumbuhan..." /> : <ApexChart options={options} />}
    </ChartCard>
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
      height: CHART_HEIGHT,
      fontFamily: "inherit",
      animations: { enabled: true, speed: 700 },
    },
    labels: distribution.map((d) => d.name),
    colors: [palette.chart5, palette.chart3, palette.chart2, palette.chart1, palette.chart4],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      offsetY: 2,
      itemMargin: { horizontal: 10, vertical: 3 },
      labels: { colors: palette.muted },
      markers: { width: 6, height: 6, offsetX: -2 },
    },
    stroke: { width: 2, colors: [palette.background] },
    dataLabels: {
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: { fontSize: "12px" },
      dropShadow: { enabled: false },
    },
    tooltip: {
      theme: dark ? "dark" : "light",
      y: { formatter: (val) => `${val} toko` },
    },
    series: distribution.map((d) => d.count),
  };

  return (
    <ChartCard
      icon={MapPin}
      title="Distribusi toko per kecamatan"
      description="Dihitung langsung oleh backend (`distribution`), bukan hasil filter di halaman ini."
    >
      {isLoading ? (
        <ChartLoading label="Memuat distribusi..." />
      ) : distribution.length === 0 ? (
        <ChartEmptyState label="Belum ada data distribusi." />
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
      description="Rating toko turun lebih dari 0.5 dalam seminggu terakhir."
      className="h-full"
    >
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
              className="group flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-3.5 py-2.5 text-sm transition-colors hover:bg-warning/10"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-xs font-bold text-warning tabular-nums">
                {index + 1}
              </span>
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span className="min-w-0 flex-1 truncate font-medium text-heading">{shop.name ?? "Toko tidak diketahui"}</span>
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
      <div className="animate-fade-up">
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground">
          <span className="icon-tile size-9">
            <ChartNoAxesColumnIncreasing className="size-4.5" />
          </span>
          Statistik
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Jumlah toko, pengguna, dan pertumbuhan platform.</p>
      </div>
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