"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviewDocument } from "@/lib/queries/shops";
import { ApiError } from "@/lib/api";
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
  const reviewDocument = useReviewDocument(shopId);

  function handleReview(status: DocStatus) {
    reviewDocument.mutate(
      { docKey, status, note: note || undefined },
      {
        onSuccess: () => toast.success(`${label}: ditandai ${STATUS_LABEL[status].toLowerCase()}`),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan review dokumen"),
      }
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Badge variant={STATUS_VARIANT[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
          >
            Valid
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={reviewDocument.isPending}
            onClick={() => handleReview("needs_revision")}
          >
            Perlu revisi
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reviewDocument.isPending}
            onClick={() => handleReview("invalid")}
          >
            Tidak valid
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
