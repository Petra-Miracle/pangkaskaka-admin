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

export type AiDocReviewResult = { available: true; doc_key: string; notes: string } | { available: false; reason: string };

// Advisory-only: asks the backend to have Gemini Vision describe/flag the
// uploaded document, purely to help the admin's own manual review — it never
// decides valid/invalid, and the result isn't written to any database (see
// backend/server.py's admin_ai_review_doc), so nothing here is cached or
// invalidated either. Each click is a fresh, independent analysis.
export function useAiReviewDocument(shopId: string) {
  return useMutation({
    mutationFn: (docKey: DocKey) =>
      apiFetch<AiDocReviewResult>(`/admin/shops/${shopId}/documents/${docKey}/ai-review`, {
        method: "POST",
      }),
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

// POST /admin/shops/{shop_id}/suspend exists today (AGENT_BRIEF.md section 4,
// "already exist" table) — only the *listing* endpoint is missing. Unscoped
// (takes shopId per-call) since it's invoked from a directory table with many
// rows, unlike useVerifyShop which lives on a single shop's detail page.
export function useSuspendShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, reason }: { shopId: string; reason?: string }) =>
      apiFetch(`/admin/shops/${shopId}/suspend`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: (_data, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: ["shops", "all"] });
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
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
