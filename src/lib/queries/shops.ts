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

// There is no admin "all shops" endpoint yet (AGENT_BRIEF.md, section 4), so
// the full directory is assembled from the two lists that do exist: public
// /shops only returns approved+verified shops, /admin/pending-shops only
// returns shops still awaiting review. Merged + deduped by id for safety.
export function useAllShops() {
  return useQuery({
    queryKey: ["shops", "all"],
    queryFn: async () => {
      const [publicShops, pendingShops] = await Promise.all([
        apiFetch<{ shops: Shop[] }>("/shops").then((data) => data.shops),
        apiFetch<{ shops: Shop[] }>("/admin/pending-shops").then((data) => data.shops),
      ]);
      const byId = new Map<string, Shop>();
      for (const shop of [...publicShops, ...pendingShops]) {
        byId.set(shop.id, shop);
      }
      return Array.from(byId.values());
    },
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
