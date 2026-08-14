import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardStats } from "@/types/admin";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<{ stats: DashboardStats }>("/admin/dashboard"),
    select: (data) => data.stats,
  });
}
