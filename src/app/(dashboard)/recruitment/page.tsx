"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ClipboardList, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/nav/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useRecruitmentCriteria, useUpdateRecruitmentCriteria } from "@/lib/queries/recruitment";
import { getSafeErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function RecruitmentPage() {
  const { data, isLoading, isError } = useRecruitmentCriteria();
  const updateCriteria = useUpdateRecruitmentCriteria();
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    // Seed the editable draft once fresh server data arrives — not a value
    // React derives every render, so a plain effect is the right tool here.
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(data.items);
    }
  }, [data]);

  const isDirty = data ? JSON.stringify(items) !== JSON.stringify(data.items) : false;
  const hasEmpty = items.some((item) => !item.trim());

  function updateItem(index: number, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, ""]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reset() {
    if (data) setItems(data.items);
  }

  function handleSave() {
    updateCriteria.mutate(
      items.map((item) => item.trim()),
      {
        onSuccess: () => toast.success("Kriteria rekrutmen disimpan"),
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menyimpan kriteria")),
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rekrutmen"
        title="Recruitment"
        description="Kriteria yang dipakai pemilik toko untuk menilai pelamar karyawan."
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat kriteria rekrutmen. Coba muat ulang halaman.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="icon-tile size-10">
              <ClipboardList className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">Kriteria penilaian karyawan</CardTitle>
              <CardDescription>
                Daftar ini tampil ke pemilik toko saat menilai pelamar karyawan. Urutan bisa diubah,
                dan perubahan langsung berlaku untuk semua toko begitu disimpan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner color="brand" size="sm" label="Memuat kriteria..." />
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada kriteria. Tambahkan minimal satu sebelum menyimpan.
            </p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <Input
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder="Tulis kriteria..."
                  className="flex-1"
                />
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    className="size-8"
                    aria-label="Pindah ke atas"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    className="size-8"
                    aria-label="Pindah ke bawah"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="size-8 text-destructive hover:text-destructive"
                    aria-label="Hapus kriteria"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {!isLoading && (
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="mt-2 w-full gap-2 border-dashed"
            >
              <Plus className="size-4" />
              Tambah kriteria
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {data && `Terakhir diperbarui ${formatRelativeTime(data.updated_at)}`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={!isDirty || updateCriteria.isPending} onClick={reset}>
              Batal
            </Button>
            <Button
              type="button"
              disabled={!isDirty || hasEmpty || updateCriteria.isPending}
              onClick={handleSave}
              className="gap-2"
            >
              {updateCriteria.isPending ? (
                <Spinner color="brand" size="xs" label="Menyimpan..." />
              ) : (
                <Save className="size-4" />
              )}
              Simpan perubahan
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
