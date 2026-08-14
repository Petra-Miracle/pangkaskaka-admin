import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ADMIN_USER_ROLES, type AdminUser } from "@/types/admin";

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
