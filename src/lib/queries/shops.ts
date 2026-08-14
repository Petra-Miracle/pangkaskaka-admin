import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DocKey, DocStatus, Shop } from "@/types/admin";

export function usePendingShops() {
  return useQuery({
    queryKey: ["pending-shops"],
    queryFn: () => apiFetch<{ shops: Shop[] }>("/admin/pending-shops"),
    select: (data) => data.shops,
  });
}

export function useShop(shopId: string) {
  return useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => apiFetch<Shop>(`/shops/${shopId}`),
    enabled: !!shopId,
  });
}

export function useReviewDocument(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docKey, status, note }: { docKey: DocKey; status: DocStatus; note?: string }) =>
      apiFetch(`/admin/shops/${shopId}/documents/${docKey}/review`, {
        method: "POST",
        body: { status, note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
      queryClient.invalidateQueries({ queryKey: ["pending-shops"] });
    },
  });
}

export function useVerifyShop(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, note }: { decision: "approved" | "rejected"; note?: string }) =>
      apiFetch(`/admin/shops/${shopId}/verify`, {
        method: "POST",
        body: { decision, note },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
      queryClient.invalidateQueries({ queryKey: ["pending-shops"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
