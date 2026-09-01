import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ADMIN_USER_ROLES, type AdminUser, type AdminUserRole } from "@/types/admin";

async function fetchRole(role: string): Promise<AdminUser[]> {
  const data = await apiFetch<{ total: number; users: AdminUser[] }>(
    `/admin/users?role=${encodeURIComponent(role)}&size=200`
  );
  return data.users;
}

// GET /admin/users with no `role` param silently behaves like role=customer
// on the live API rather than returning every role, so "show everything" is
// built by querying each known role in parallel and merging client-side.
export function useAllUsers() {
  return useQuery({
    queryKey: ["admin-users", "all"],
    queryFn: async () => {
      const results = await Promise.all(ADMIN_USER_ROLES.map(fetchRole));
      return results.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  });
}

// POST/PUT/DELETE /admin/users/{id}(/suspend|/activate|/role) — added
// 2026-08-20 alongside the backend endpoints themselves (they didn't exist
// before: only GET /admin/users was live). Backend rejects targeting an
// admin account or the caller's own account with a 400 — surfaced via
// getSafeErrorMessage, no client-side duplication of that rule beyond
// disabling the buttons for those rows.
export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiFetch<{ ok: boolean }>(`/admin/users/${id}/suspend`, { method: "POST", body: { reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}/activate`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUserRole }) =>
      apiFetch<{ ok: boolean; role: string }>(`/admin/users/${id}/role`, { method: "PUT", body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// PUT /admin/users/{id}/set-password — unlike suspend/role/delete this has no
// self/admin restriction server-side (setting a password isn't destructive to
// account access the way those are, and an admin resetting their own or a
// fellow admin's password during onboarding/testing is a normal case). Not
// cached/invalidated beyond the users list since the password itself isn't
// part of any AdminUser field the UI reads.
export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      apiFetch<{ ok: boolean }>(`/admin/users/${id}/set-password`, {
        method: "PUT",
        body: { new_password: newPassword },
      }),
  });
}
