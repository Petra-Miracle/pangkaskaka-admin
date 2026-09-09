"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@heroui/react";
import { ImageOff, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/nav/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBox } from "@/components/ui/search-box";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { HairstylesImportDialog } from "@/components/hairstyles/import-dialog";
import {
  useCreateHairstyle,
  useDeleteHairstyle,
  useHairstyles,
  useUpdateHairstyle,
} from "@/lib/queries/hairstyles";
import { getSafeErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FACE_SHAPE_LABELS, FACE_SHAPES, type FaceShape, type Hairstyle } from "@/types/admin";

function HairstyleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground">
        <ImageOff className="size-6" />
      </div>
    );
  }

  return (
    <div className="img-zoom group overflow-hidden rounded-lg border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="aspect-video w-full object-cover"
      />
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-success-bg text-success"
      : score >= 40
        ? "bg-warning-bg text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", tone)}>
      {score}
    </span>
  );
}

function SkeletonCards({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="glass-card">
          <Card.Content className="gap-3 pt-4">
            <div className="skeleton aspect-video w-full rounded-lg" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-full opacity-60" />
            <div className="flex gap-1.5">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </>
  );
}

function scoresFromHairstyle(hairstyle?: Hairstyle): Partial<Record<FaceShape, string>> {
  const scores: Partial<Record<FaceShape, string>> = {};
  for (const shape of FACE_SHAPES) {
    const value = hairstyle?.match_score_map?.[shape];
    if (value !== undefined) scores[shape] = String(value);
  }
  return scores;
}

function HairstyleFormDialog({
  hairstyle,
  trigger,
}: {
  hairstyle?: Hairstyle;
  trigger: React.ReactElement;
}) {
  const isEdit = !!hairstyle;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(hairstyle?.name ?? "");
  const [description, setDescription] = useState(hairstyle?.description ?? "");
  const [imageUrl, setImageUrl] = useState(hairstyle?.image_url ?? "");
  const [scores, setScores] = useState<Partial<Record<FaceShape, string>>>(() =>
    scoresFromHairstyle(hairstyle)
  );

  const createHairstyle = useCreateHairstyle();
  const updateHairstyle = useUpdateHairstyle();
  const isPending = createHairstyle.isPending || updateHairstyle.isPending;
  const isValid = name.trim() && description.trim() && imageUrl.trim();

  function resetForm() {
    setName(hairstyle?.name ?? "");
    setDescription(hairstyle?.description ?? "");
    setImageUrl(hairstyle?.image_url ?? "");
    setScores(scoresFromHairstyle(hairstyle));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleSubmit() {
    const match_score_map: Partial<Record<FaceShape, number>> = {};
    for (const shape of FACE_SHAPES) {
      const raw = scores[shape];
      const num = raw ? Math.min(100, Math.max(0, Number(raw))) : 0;
      if (num > 0) match_score_map[shape] = num;
    }

    const body = {
      name: name.trim(),
      image_url: imageUrl.trim(),
      description: description.trim(),
      match_score_map,
    };

    const onSuccess = () => {
      toast.success(isEdit ? "Gaya rambut diperbarui" : "Gaya rambut ditambahkan");
      setOpen(false);
    };
    const onError = (err: unknown) =>
      toast.error(getSafeErrorMessage(err, isEdit ? "Gagal memperbarui gaya rambut" : "Gagal menambahkan gaya rambut"));

    if (isEdit) {
      updateHairstyle.mutate({ id: hairstyle.id, ...body }, { onSuccess, onError });
    } else {
      createHairstyle.mutate(body, { onSuccess, onError });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${hairstyle.name}` : "Tambah gaya rambut"}</DialogTitle>
          <DialogDescription>
            Langsung tampil ke customer nyata begitu disimpan — tidak ada tahap approval. Pastikan foto bisa
            diakses publik dan nama/deskripsi sudah versi final.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hs-name">Nama</Label>
            <Input
              id="hs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Fade Pompadour"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hs-description">Deskripsi</Label>
            <Textarea
              id="hs-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat untuk customer..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hs-image">URL Foto</Label>
            <Input
              id="hs-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            {imageUrl.trim() && <HairstyleImage src={imageUrl.trim()} alt="Preview foto" />}
          </div>

          <div className="space-y-2">
            <Label>Skor kecocokan per bentuk wajah</Label>
            <p className="text-xs text-muted-foreground">
              0–100, kosongkan yang tidak relevan untuk gaya ini.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FACE_SHAPES.map((shape) => (
                <div key={shape} className="space-y-1">
                  <Label htmlFor={`hs-score-${shape}`} className="text-xs font-normal text-muted-foreground">
                    {FACE_SHAPE_LABELS[shape]}
                  </Label>
                  <Input
                    id={`hs-score-${shape}`}
                    type="number"
                    min={0}
                    max={100}
                    value={scores[shape] ?? ""}
                    onChange={(e) => setScores((prev) => ({ ...prev, [shape]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button disabled={!isValid || isPending} onClick={handleSubmit} className="gap-2">
            {isPending && <Spinner color="brand" size="xs" label="Menyimpan..." />}
            {isEdit ? "Simpan perubahan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteHairstyleDialog({ hairstyle }: { hairstyle: Hairstyle }) {
  const [open, setOpen] = useState(false);
  const deleteHairstyle = useDeleteHairstyle();

  function handleDelete() {
    deleteHairstyle.mutate(hairstyle.id, {
      onSuccess: () => {
        toast.success(`${hairstyle.name} dihapus`);
        setOpen(false);
      },
      onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menghapus gaya rambut")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" aria-label="Hapus">
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus {hairstyle.name}?</DialogTitle>
          <DialogDescription>
            Aksi ini permanen dan tidak bisa dibatalkan. Gaya rambut ini akan langsung hilang dari Beranda dan
            hasil AI Face Scan di aplikasi mobile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button
            variant="destructive"
            disabled={deleteHairstyle.isPending}
            onClick={handleDelete}
            className="gap-2"
          >
            {deleteHairstyle.isPending && <Spinner color="danger" size="xs" label="Menghapus..." />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HairstylesPage() {
  const { data: hairstyles, isLoading, isError } = useHairstyles();
  const [search, setSearch] = useState("");
  const [shape, setShape] = useState<"all" | FaceShape>("all");

  const filtered = useMemo(() => {
    if (!hairstyles) return [];
    const q = search.trim().toLowerCase();
    return hairstyles.filter((h) => {
      const matchesShape = shape === "all" || h.suitable_shapes.includes(shape);
      const matchesSearch =
        !q || h.name?.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q);
      return matchesShape && matchesSearch;
    });
  }, [hairstyles, search, shape]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Hairstyles"
        description="Gaya rambut untuk rekomendasi AI Face Scan di aplikasi mobile."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <HairstylesImportDialog />
            <HairstyleFormDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Tambah gaya rambut
                </Button>
              }
            />
          </div>
        }
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat katalog gaya rambut. Coba muat ulang halaman.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox
          placeholder="Cari nama atau deskripsi..."
          value={search}
          onChange={setSearch}
          icon={<Sparkles className="size-4" />}
        />
        <Select value={shape} onValueChange={(value) => setShape((value as "all" | FaceShape) ?? "all")}>
          <SelectTrigger className="sm:w-52">
            <SelectValue>
              {(value: "all" | FaceShape) => (value === "all" ? "Semua bentuk wajah" : FACE_SHAPE_LABELS[value])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua bentuk wajah</SelectItem>
            {FACE_SHAPES.map((s) => (
              <SelectItem key={s} value={s}>
                {FACE_SHAPE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && <SkeletonCards />}

        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-medium">
              {hairstyles?.length === 0
                ? "Katalog masih kosong. Tambahkan gaya rambut pertama."
                : "Tidak ada gaya rambut yang cocok dengan filter saat ini."}
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((h) => (
            <Card key={h.id} className="glass-card glass-card-hover card-glow group">
              <Card.Content className="gap-3 pt-4">
                <HairstyleImage src={h.image_url} alt={h.name} />
                <div>
                  <Card.Title className="text-sm text-foreground">{h.name}</Card.Title>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {h.suitable_shapes.length === 0 && (
                    <span className="text-xs text-muted-foreground">Belum ada skor bentuk wajah</span>
                  )}
                  {h.suitable_shapes.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1.5 font-normal">
                      {FACE_SHAPE_LABELS[s] ?? s}
                      {h.match_score_map?.[s] !== undefined && (
                        <ScoreBadge score={h.match_score_map[s]} />
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-end gap-1.5 border-t border-border pt-3 opacity-90 transition-opacity group-hover:opacity-100">
                  <HairstyleFormDialog
                    hairstyle={h}
                    trigger={
                      <Button size="icon" variant="ghost" className="size-8" aria-label="Edit">
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                  <DeleteHairstyleDialog hairstyle={h} />
                </div>
              </Card.Content>
            </Card>
          ))}
      </div>
    </div>
  );
}
