"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@heroui/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useReviewDocument } from "@/lib/queries/shops";
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

export function DocumentReviewCard({
  shopId,
  docKey,
  label,
  doc,
}: {
  shopId: string;
  docKey: DocKey;
  label: string;
  doc: ShopDocument;
}) {
  const [note, setNote] = useState(doc.note ?? "");
  const [pendingStatus, setPendingStatus] = useState<DocStatus | null>(null);
  const reviewDocument = useReviewDocument(shopId);

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
    <Card className={cn("glass-card border-t-2 transition-colors", STATUS_ACCENT[doc.status])}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="text-base text-foreground">{label}</Card.Title>
          <Badge variant={STATUS_VARIANT[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
        </div>
      </Card.Header>
      <Card.Content className="gap-3">
        {doc.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.url}
            alt={label}
            className="h-48 w-full rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Belum diunggah
          </div>
        )}
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
