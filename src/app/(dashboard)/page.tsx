import { Store, ShieldAlert, Users, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const KPIS = [
  { label: "Total shops", icon: Store },
  { label: "Pending verifications", icon: ShieldAlert },
  { label: "Total customers", icon: Users },
  { label: "Revenue today", icon: Wallet },
];

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          KPI summary and growth analytics land here in Phase 1.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(({ label, icon: Icon }) => (
          <Card key={label} className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </div>
              <CardTitle className="text-3xl">—</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
