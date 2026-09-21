"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Card } from "@heroui/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  useAiReviewDocument,
  useDocumentPreview,
  useReviewDocument,
  type AiDocReviewResult,
} from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DocKey, DocStatus, ShopDocument } from "@/types/admin";

const STATUS_VARIANT: Record<DocStatus, "outline" | "default" | "destructive" | "secondary"> = {
  pending: "outline",
  valid: "default",
  invalid: "destructive",
  needs_revision: "secondary",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  pending: "Belum direview",
  valid: "Valid",
  invalid: "Tidak valid",
  needs_revision: "Perlu revisi",
};

const STATUS_ACCENT: Record<DocStatus, string> = {
  pending: "border-border",
  valid: "border-emerald-500/30",
  invalid: "border-destructive/30",
  needs_revision: "border-amber-500/30",
};

const EMPTY_DOC: ShopDocument = {
  url: "",
  status: "pending",
  note: "",
  reviewed_at: null,
  reviewed_by: null,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function DocumentReviewCard({
  shopId,
  docKey,
  label,
  doc: rawDoc,
  unlockToken,
  onRequestUnlock,
}: {
  shopId: string;
  docKey: DocKey;
  label: string;
  // Bisa undefined kalau objek `docs` toko tidak lengkap.
  doc?: ShopDocument;
  unlockToken: string | null;
  onRequestUnlock: () => void;
}) {
  const doc = rawDoc ?? EMPTY_DOC;
  const [note, setNote] = useState(doc.note ?? "");
  const [pendingStatus, setPendingStatus] = useState<DocStatus | null>(null);
  const [aiResult, setAiResult] = useState<AiDocReviewResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const reviewDocument = useReviewDocument(shopId);
  const aiReview = useAiReviewDocument(shopId);
  const previewDocument = useDocumentPreview(shopId);
  const hasFile = doc.has_file ?? Boolean(doc.url);

  // A locked/expired dashboard session must also hide any image already
  // rendered in the current tab; the server remains the actual enforcement.
  useEffect(() => {
    if (!unlockToken) {
      setPreviewUrl(null);
      setAiResult(null);
    }
  }, [unlockToken]);

  function handlePreview() {
    if (!hasFile) return;
    if (!unlockToken) {
      onRequestUnlock();
      return;
    }
    previewDocument.mutate(
      { docKey, unlockToken },
      {
        onSuccess: (data) => setPreviewUrl(`${API_BASE_URL}/documents/preview/${data.token}`),
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal membuka dokumen")),
      }
    );
  }

  function handleAiReview() {
    setAiResult(null);
    if (!unlockToken) {
      onRequestUnlock();
      return;
    }
    aiReview.mutate({ docKey, unlockToken }, {
      onSuccess: (data) => setAiResult(data),
      onError: (err) => toast.error(getSafeErrorMessage(err, "Analisis AI gagal, lanjutkan review manual")),
    });
  }

  function handleReview(status: DocStatus) {
    setPendingStatus(status);
    reviewDocument.mutate(
      { docKey, status, note: note || undefined },
      {
        onSuccess: () => toast.success(`${label}: ditandai ${STATUS_LABEL[status].toLowerCase()}`),
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menyimpan review dokumen")),
        onSettled: () => setPendingStatus(null),
      }
    );
  }

  const reviewedAt = doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleString("id-ID") : null;

  return (
    <Card className={cn("glass-card glass-card-hover border-t-2 transition-colors", STATUS_ACCENT[doc.status])}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="text-base text-foreground">{label}</Card.Title>
          <Badge variant={STATUS_VARIANT[doc.status]} className={doc.status === "pending" ? "animate-pulse-soft" : undefined}>
            {STATUS_LABEL[doc.status]}
          </Badge>
        </div>
      </Card.Header>
      <Card.Content className="gap-3">
        {previewUrl ? (
          <div className="img-zoom group rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label}
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : hasFile ? (
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewDocument.isPending}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] text-sm text-muted-foreground transition-colors hover:bg-primary/[0.07] disabled:cursor-wait"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {previewDocument.isPending ? <Spinner color="brand" size="xs" label="Membuka..." /> : <LockKeyhole className="size-4" />}
            </span>
            <span className="font-medium text-foreground">
              {unlockToken ? "Klik untuk tampilkan dokumen" : "Dokumen terkunci"}
            </span>
            <span className="text-xs">{unlockToken ? "Akses sementara aktif" : "Masukkan secret key untuk melihat"}</span>
          </button>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Belum diunggah
          </div>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!hasFile || aiReview.isPending}
            onClick={handleAiReview}
            className="gap-1.5"
          >
            {aiReview.isPending ? (
              <Spinner color="brand" size="xs" label="Menganalisis..." />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {unlockToken ? "Analisis dengan AI" : "Buka kunci untuk analisis"}
          </Button>

          {aiResult && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5 text-xs",
                aiResult.available
                  ? "border-primary/20 bg-primary/5 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              {aiResult.available ? (
                <>
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="size-3 shrink-0" />
                    Catatan AI (bantuan, bukan keputusan final)
                  </p>
                  <p className="leading-relaxed">{aiResult.notes}</p>
                </>
              ) : (
                <p>{aiResult.reason}</p>
              )}
            </div>
          )}
        </div>

        <Textarea
          placeholder="Catatan untuk pemilik toko (opsional untuk valid, disarankan untuk invalid/revisi)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            disabled={reviewDocument.isPending}
            onClick={() => handleReview("valid")}
            className="gap-1.5"
          >
            {pendingStatus === "valid" && <Spinner color="success" size="xs" label="Menyimpan..." />}
            Valid
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={reviewDocument.isPending}
            onClick={() => handleReview("needs_revision")}
            className="gap-1.5"
          >
            {pendingStatus === "needs_revision" && <Spinner color="warning" size="xs" label="Menyimpan..." />}
            Perlu revisi
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reviewDocument.isPending}
            onClick={() => handleReview("invalid")}
            className="gap-1.5"
          >
            {pendingStatus === "invalid" && <Spinner color="danger" size="xs" label="Menyimpan..." />}
            Tidak valid
          </Button>
        </div>

        {reviewedAt && (
          <p className="text-xs text-muted-foreground">
            Direview {reviewedAt}
            {doc.reviewed_by ? ` oleh ${doc.reviewed_by}` : ""}
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
