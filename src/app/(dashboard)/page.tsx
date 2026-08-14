"use client";

import { Store, ShieldAlert, Users, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan KPI dari seluruh platform PangkasKAKA.
        </p>
      </div>
      {isError && (
        <p className="text-sm text-destructive">
          Gagal memuat data dashboard. Coba muat ulang halaman.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(({ label, icon: Icon, key, format }) => (
          <Card key={label} className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <CardTitle className="text-3xl">
                  {stats ? (format ? format(stats[key]) : stats[key].toLocaleString("id-ID")) : "—"}
                </CardTitle>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
