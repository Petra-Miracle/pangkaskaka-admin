import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Hairstyle, HairstyleInput } from "@/types/admin";

// GET /admin/hairstyles, POST/PUT/DELETE /admin/hairstyles(/{id}) — all
// verified against production 2026-08-19. POST/PUT return { hairstyle },
// DELETE returns { ok: true }. match_score_map keys are validated
// server-side against the 5 known face shapes (422 on anything else), so
// no client-side re-validation of that beyond the FaceShape type is needed.
export function useHairstyles() {
  return useQuery({
    queryKey: ["hairstyles"],
    queryFn: () => apiFetch<{ hairstyles: Hairstyle[] }>("/admin/hairstyles"),
    select: (data) => data.hairstyles,
  });
}

export function useCreateHairstyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HairstyleInput) =>
      apiFetch<{ hairstyle: Hairstyle }>("/admin/hairstyles", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hairstyles"] });
    },
  });
}

export function useUpdateHairstyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: HairstyleInput & { id: string }) =>
      apiFetch<{ hairstyle: Hairstyle }>(`/admin/hairstyles/${id}`, {
        method: "PUT",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hairstyles"] });
    },
  });
}

export function useDeleteHairstyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/admin/hairstyles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hairstyles"] });
    },
  });
}
