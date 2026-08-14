"use client";

import { Store, ShieldAlert, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDashboardStats } from "@/lib/queries/dashboard";
import type { DashboardStats } from "@/types/admin";

const KPIS: { label: string; icon: typeof Store; key: keyof DashboardStats; format?: (n: number) => string }[] = [
  { label: "Total shops", icon: Store, key: "total_shops" },
  { label: "Pending verifications", icon: ShieldAlert, key: "pending_verifications" },
  { label: "Total customers", icon: Users, key: "total_customers" },
  {
    label: "Revenue today",
    icon: Wallet,
    key: "revenue_today",
    format: (n) => `Rp ${n.toLocaleString("id-ID")}`,
  },
];

export default function DashboardHomePage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="mb-2 hidden md:mt-1 md:block">
        <h1 className="mb-1 text-4xl font-bold tracking-tight text-primary lg:text-5xl">Dashboard</h1>
        <p className="text-base text-muted-foreground/90">
          Ringkasan KPI dari seluruh platform PangkasKAKA.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </p>
      )}

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {KPIS.map(({ label, icon: Icon, key, format }) => (
          <Card key={label} interactive className="h-36 justify-between">
            <CardHeader className="flex-row items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-accent text-primary">
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
    </div>
  );
}
