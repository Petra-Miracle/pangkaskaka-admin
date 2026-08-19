"use client";

import { useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Clock, ImageOff, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/nav/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHairstyles } from "@/lib/queries/hairstyles";
import { FACE_SHAPE_LABELS, FACE_SHAPES, type FaceShape } from "@/types/admin";

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-lg border border-border object-cover"
    />
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
          <Badge variant="outline" className="gap-1.5">
            <Clock className="size-3" />
            Baca saja
          </Badge>
        }
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat katalog gaya rambut. Coba muat ulang halaman.
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <Clock className="mt-0.5 size-3.5 shrink-0" />
        Backend cuma punya <code className="font-mono">GET /hairstyles</code> — tambah, edit, dan hapus belum
        ada endpoint-nya sama sekali (bukan cuma belum dibangun di sini). Spesifikasi endpoint yang
        dibutuhkan sudah dicatat di <code className="font-mono">BACKEND_ENDPOINTS_NEEDED.md</code>.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari nama atau deskripsi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && <SkeletonCards />}

        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-medium">
              {hairstyles?.length === 0
                ? "Katalog masih kosong."
                : "Tidak ada gaya rambut yang cocok dengan filter saat ini."}
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((h) => (
            <Card key={h.id} className="glass-card glass-card-hover">
              <Card.Content className="gap-3 pt-4">
                <HairstyleImage src={h.image_url} alt={h.name} />
                <div>
                  <Card.Title className="text-sm text-foreground">{h.name}</Card.Title>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {h.suitable_shapes.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {FACE_SHAPE_LABELS[s] ?? s}
                      {h.match_score_map?.[s] !== undefined && (
                        <span className="ml-1 tabular-nums opacity-70">{h.match_score_map[s]}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </Card.Content>
            </Card>
          ))}
      </div>
    </div>
  );
}
