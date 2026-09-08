"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CredentialDialog, type IssuedCredential } from "@/components/admins/credential-dialog";
import { useCreateShopAdmin, useShopAdmins } from "@/lib/queries/admins";
import { useAllShops } from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Dipakai dua tempat: halaman /admins (dengan pemilih toko) dan tabel /shops
// (per baris, `lockedShop` mengunci ke toko baris itu).
export function CreateShopAdminDialog({
  trigger,
  lockedShop,
}: {
  trigger: React.ReactElement;
  lockedShop?: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shopId, setShopId] = useState<string | null>(lockedShop?.id ?? null);
  const [issued, setIssued] = useState<IssuedCredential | null>(null);

  const { data: shops } = useAllShops();
  const { data: admins } = useShopAdmins();
  const createAdmin = useCreateShopAdmin();

  const takenShopIds = useMemo(
    () => new Set((admins ?? []).flatMap((a) => a.managed_shop_ids)),
    [admins]
  );

  const availableShops = useMemo(
    () =>
      (shops ?? [])
        .filter((s) => !takenShopIds.has(s.id))
        .sort((a, b) => a.name.localeCompare(b.name, "id")),
    [shops, takenShopIds]
  );

  const lockedShopTaken = lockedShop ? takenShopIds.has(lockedShop.id) : false;

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setShopId(lockedShop?.id ?? null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit =
    name.trim().length >= 2 &&
    emailValid &&
    phone.trim().length >= 6 &&
    !!shopId &&
    !lockedShopTaken &&
    !createAdmin.isPending;

  function handleSubmit() {
    if (!shopId) return;
    createAdmin.mutate(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        managed_shop_ids: [shopId],
      },
      {
        onSuccess: (res) => {
          const shopName =
            lockedShop?.name ?? shops?.find((s) => s.id === shopId)?.name ?? "toko terpilih";
          toast.success(`Akun admin untuk ${shopName} dibuat`);
          setOpen(false);
          resetForm();
          setIssued({
            title: `Akun admin ${res.admin.name} siap`,
            email: res.admin.email,
            password: res.password,
          });
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal membuat akun admin")),
      }
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={trigger} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat akun admin toko</DialogTitle>
            <DialogDescription>
              Admin hanya mengelola satu toko dan hanya menangani validasi pelamar StreetBarber. Password
              dibuat otomatis dan ditampilkan sekali setelah akun jadi.
            </DialogDescription>
          </DialogHeader>

          {lockedShopTaken ? (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              {lockedShop?.name} sudah punya admin. Satu toko hanya bisa punya satu admin — pindahkan atau
              hapus admin lama dulu lewat halaman Kelola Admin.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ca-shop">Toko</Label>
                {lockedShop ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    <Store className="size-3.5 text-muted-foreground" />
                    {lockedShop.name}
                  </div>
                ) : (
                  <Select
                    value={shopId}
                    onValueChange={(value) => setShopId((value as string | null) ?? null)}
                  >
                    <SelectTrigger id="ca-shop" className="w-full">
                      <SelectValue placeholder="Pilih toko yang belum punya admin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableShops.length === 0 ? (
                        <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                          Semua toko terdaftar sudah punya admin.
                        </div>
                      ) : (
                        availableShops.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-name">Nama admin</Label>
                <Input
                  id="ca-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-email">Email</Label>
                <Input
                  id="ca-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.toko@contoh.com"
                />
                {email.trim() && !emailValid && (
                  <p className="text-xs text-destructive">Format email tidak valid.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-phone">No. HP</Label>
                <Input
                  id="ca-phone"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Batal</Button>} />
            <Button disabled={!canSubmit} onClick={handleSubmit} className="gap-2">
              {createAdmin.isPending && <Spinner color="brand" size="xs" label="Membuat..." />}
              Buat akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialDialog credential={issued} onClose={() => setIssued(null)} />
    </>
  );
}
