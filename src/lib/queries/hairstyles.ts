import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Hairstyle } from "@/types/admin";

// GET /hairstyles is public (verified: works with or without a bearer
// token) and read-only. POST/PUT/DELETE at both /hairstyles and
// /admin/hairstyles all 404 — see BACKEND_ENDPOINTS_NEEDED.md for the
// write-endpoint spec that still needs to land before add/edit/delete can
// be built here.
export function useHairstyles() {
  return useQuery({
    queryKey: ["hairstyles"],
    queryFn: () => apiFetch<{ hairstyles: Hairstyle[] }>("/hairstyles"),
    select: (data) => data.hairstyles,
  });
}
