"use client";

import { Store, ShieldAlert, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatisticsSection } from "@/components/dashboard/statistics";
import { useDashboardStats } from "@/lib/queries/dashboard";
import { useGreeting, useStoredAdminUser } from "@/lib/client-values";
import type { DashboardStats } from "@/types/admin";

const KPIS: { label: string; icon: typeof Store; key: keyof DashboardStats; format?: (n: number) => string; accent: string }[] = [
  {
    label: "Total shops",
    icon: Store,
    key: "total_shops",
    accent: "from-primary/15 to-primary/5 text-primary",
  },
  {
    label: "Pending verifications",
    icon: ShieldAlert,
    key: "pending_verifications",
    accent: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  },
  {
    label: "Total customers",
    icon: Users,
    key: "total_customers",
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Revenue today",
    icon: Wallet,
    key: "revenue_today",
    format: (n) => `Rp ${n.toLocaleString("id-ID")}`,
    accent: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
  },
];

function formatToday() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardHomePage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const greeting = useGreeting();
  const user = useStoredAdminUser();
  const adminName = user?.name?.split(" ")[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="mb-2 hidden md:mt-1 md:block">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary/80 uppercase">
          {formatToday()}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-primary lg:text-5xl">
          {greeting}
          {adminName ? `, ${adminName}` : ""}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground/90">
          Ringkasan KPI dari seluruh platform PangkasKAKA.
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {KPIS.map(({ label, icon: Icon, key, format, accent }) => (
          <Card key={label} interactive className="h-36 justify-between">
            <CardHeader className="flex-row items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className={`flex size-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br shadow-sm ${accent}`}>
                <Icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Spinner color="brand" size="sm" label="Memuat data..." />
              ) : (
                <div className="text-4xl leading-none font-bold tracking-tight text-primary">
                  {stats ? (format ? format(stats[key]) : stats[key].toLocaleString("id-ID")) : "—"}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <StatisticsSection />
    </div>
  );
}