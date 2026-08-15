import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { RecruitmentCriteria } from "@/types/admin";

// Undocumented in AGENT_BRIEF (only the PUT was listed) — found by probing
// the real API: GET lives at /recruitment/criteria (no /admin prefix), PUT
// at /admin/recruitment/criteria with body { items: string[] }. It's a plain
// ordered list of requirement strings, not the "weighted scoring" shape the
// brief's one-line description implied.
export function useRecruitmentCriteria() {
  return useQuery({
    queryKey: ["recruitment-criteria"],
    queryFn: () => apiFetch<RecruitmentCriteria>("/recruitment/criteria"),
  });
}

export function useUpdateRecruitmentCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: string[]) =>
      apiFetch<{ ok: boolean; count: number }>("/admin/recruitment/criteria", {
        method: "PUT",
        body: { items },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-criteria"] });
    },
  });
}
