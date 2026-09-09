import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AdminUser } from "@/types/admin";

// Satu-satunya data StreetBarber yang tersedia dari backend hari ini adalah
// daftar akun (`GET /admin/users?role=streetbarber`). Semua metrik operasional
// — GMV, tingkat pembatalan, saldo dompet, lokasi live, dokumen + kedaluwarsa,
// riwayat verifikasi — menunggu endpoint baru yang dispesifikasikan di
// BACKEND_ENDPOINTS_NEEDED.md §9.
export function useStreetBarbers() {
  return useQuery({
    queryKey: ["street-barbers"],
    queryFn: () =>
      apiFetch<{ total: number; users: AdminUser[] }>(
        "/admin/users?role=streetbarber&size=200"
      ),
    select: (data) =>
      [...data.users].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  });
}

export function useStreetBarber(barberId: string) {
  const list = useStreetBarbers();
  return {
    ...list,
    data: list.data?.find((b) => b.id === barberId),
  };
}

// Suspend / aktifkan memakai endpoint user-management yang sudah ada
// (`/admin/users/{id}/suspend|activate`, backend server.py:2377/2396). Dibungkus
// ulang di sini supaya cache daftar StreetBarber ikut di-refresh.
export function useSuspendStreetBarber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiFetch<{ ok: boolean }>(`/admin/users/${id}/suspend`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["street-barbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useActivateStreetBarber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/admin/users/${id}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["street-barbers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
