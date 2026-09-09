"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card } from "@heroui/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useAiReviewDocument, useReviewDocument, type AiDocReviewResult } from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";
import { cn, formatDateTimeWITA } from "@/lib/utils";
import type { DocKey, DocStatus, ShopDocument } from "@/types/admin";

const STATUS_VARIANT: Record<DocStatus, "outline" | "success" | "destructive" | "warning"> = {
  pending: "outline",
  valid: "success",
  invalid: "destructive",
  needs_revision: "warning",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  pending: "Belum direview",
  valid: "Valid",
  invalid: "Tidak valid",
  needs_revision: "Perlu revisi",
};

const STATUS_ACCENT: Record<DocStatus, string> = {
  pending: "border-border",
  valid: "border-success/30",
  invalid: "border-destructive/30",
  needs_revision: "border-warning/30",
};

const EMPTY_DOC: ShopDocument = {
  url: "",
  status: "pending",
  note: "",
  reviewed_at: null,
  reviewed_by: null,
};

export function DocumentReviewCard({
  shopId,
  docKey,
  label,
  doc: rawDoc,
}: {
  shopId: string;
  docKey: DocKey;
  label: string;
  // Bisa undefined kalau objek `docs` toko tidak lengkap.
  doc?: ShopDocument;
}) {
  const doc = rawDoc ?? EMPTY_DOC;
  const [note, setNote] = useState(doc.note ?? "");
  const [pendingStatus, setPendingStatus] = useState<DocStatus | null>(null);
  const [aiResult, setAiResult] = useState<AiDocReviewResult | null>(null);
  const reviewDocument = useReviewDocument(shopId);
  const aiReview = useAiReviewDocument(shopId);

  function handleAiReview() {
    setAiResult(null);
    aiReview.mutate(docKey, {
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

  const reviewedAt = doc.reviewed_at ? formatDateTimeWITA(doc.reviewed_at) : null;

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
        {doc.url ? (
          <div className="img-zoom group rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.url}
              alt={label}
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
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
            disabled={!doc.url || aiReview.isPending}
            onClick={handleAiReview}
            className="gap-1.5"
          >
            {aiReview.isPending ? (
              <Spinner color="brand" size="xs" label="Menganalisis..." />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Analisis dengan AI
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
