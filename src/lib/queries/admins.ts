import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CreateShopAdminInput, ShopAdmin } from "@/types/admin";

// Kelola Admin toko — kontrak dibaca langsung dari backend server.py
// (repo D:\APP-PangkasKAKA, commit 42aeae4):
//   POST   /superadmin/admins                     server.py:2456  (CreateAdminIn)
//   GET    /superadmin/admins                     server.py:2482
//   PUT    /superadmin/admins/{id}                server.py:2493  (UpdateAdminScopeIn)
//   POST   /superadmin/admins/{id}/reset-password server.py:2507
// Keempatnya `require_role("superadmin")`.

// GET — respons { admins: [...] }, tiap item sudah punya `managed_shops`
// ({id,name}) hasil join, dan tidak pernah menyertakan field password.
export function useShopAdmins() {
  return useQuery({
    queryKey: ["shop-admins"],
    queryFn: () => apiFetch<{ admins: ShopAdmin[] }>("/superadmin/admins"),
    select: (data) => data.admins,
  });
}

// POST — backend yang men-generate password (`secrets.token_urlsafe`) dan
// mengembalikannya sebagai plaintext SEKALI di response. Tidak ada cara
// mengambilnya lagi setelah ini, hanya reset. 400 kalau email sudah dipakai
// atau ada shop_id yang tidak valid.
export function useCreateShopAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShopAdminInput) =>
      apiFetch<{ admin: ShopAdmin; password: string }>("/superadmin/admins", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-admins"] }),
  });
}

// PUT — mengganti seluruh daftar `managed_shop_ids`. Dashboard selalu
// mengirim tepat satu id (aturan 1 toko = 1 admin). Balasan { ok: true }.
export function useUpdateShopAdminScope() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, managedShopIds }: { id: string; managedShopIds: string[] }) =>
      apiFetch<{ ok: boolean }>(`/superadmin/admins/${id}`, {
        method: "PUT",
        body: { managed_shop_ids: managedShopIds },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-admins"] }),
  });
}

// POST reset-password — backend generate password baru, balas
// { ok: true, password } (plaintext, sekali).
export function useResetShopAdminPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean; password: string }>(`/superadmin/admins/${id}/reset-password`, {
        method: "POST",
      }),
  });
}
