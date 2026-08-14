import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AdminAnalytics } from "@/types/admin";

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch<AdminAnalytics>("/analytics/admin"),
  });
}
