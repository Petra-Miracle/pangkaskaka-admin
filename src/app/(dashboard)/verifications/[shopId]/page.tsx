"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileCheck2, Gavel, Store, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DocumentReviewCard } from "@/components/verifications/document-review-card";
import { ChatPanel } from "@/components/verifications/chat-panel";
import { usePendingShops, useShop, useVerifyShop } from "@/lib/queries/shops";
import { getSafeErrorMessage } from "@/lib/api";
import { DOC_LABELS, type DocKey } from "@/types/admin";

export default function VerificationDetailPage() {
  const params = useParams<{ shopId: string }>();
  const shopId = params.shopId;
  const router = useRouter();
  const { data: shop, isLoading, isError } = useShop(shopId);
  // GET /shops/{id} doesn't include owner info, only /admin/pending-shops does.
  const { data: pendingShops } = usePendingShops();
  const owner = shop?.owner ?? pendingShops?.find((s) => s.id === shopId)?.owner;
  const verifyShop = useVerifyShop(shopId);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const reviewedDocCount = shop
    ? Object.values(shop.docs).filter((d) => d.status !== "pending").length
    : 0;

  function handleApprove() {
    verifyShop.mutate(
      { decision: "approved" },
      {
        onSuccess: () => {
          toast.success("Toko disetujui");
          router.push("/verifications");
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menyetujui toko")),
      }
    );
  }

  function handleReject() {
    if (!rejectNote.trim()) return;
    verifyShop.mutate(
      { decision: "rejected", note: rejectNote.trim() },
      {
        onSuccess: () => {
          toast.success("Toko ditolak");
          setRejectOpen(false);
          router.push("/verifications");
        },
        onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menolak toko")),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton size-9 rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-56" />
            <div className="skeleton h-4 w-80 opacity-60" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="skeleton h-48 w-full rounded-lg" />
              <div className="skeleton h-14 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !shop) {
    return <p className="text-sm text-destructive">Gagal memuat detail toko.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/verifications")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">{shop.name}</h1>
          <p className="text-sm text-muted-foreground">{shop.address}</p>
        </div>
        <Badge variant={shop.verification_status === "pending" ? "outline" : "default"} className="ml-auto">
          {shop.verification_status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="icon-tile size-8">
              <Store className="size-4" />
            </span>
            Informasi toko
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Pemilik</p>
            <p className="font-medium">{owner?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{owner?.email}</p>
            <p className="text-xs text-muted-foreground">{owner?.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Kategori</p>
            <p className="font-medium">{shop.category}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Kisaran harga</p>
            <p className="font-medium">{shop.price_range}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bank</p>
            <p className="font-medium">{shop.bank_name}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{shop.account_number}</p>
            <p className="text-xs text-muted-foreground">{shop.account_holder}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Diajukan</p>
            <p className="font-medium">
              {new Date(shop.docs_submitted_at).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Revisi diminta</p>
            <p className="font-medium">{shop.revision_count}x</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="icon-tile size-8">
            <FileCheck2 className="size-4" />
          </span>
          Dokumen
          <span className="text-sm font-normal text-muted-foreground">
            ({reviewedDocCount}/{Object.keys(DOC_LABELS).length} direview)
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(DOC_LABELS) as DocKey[]).map((docKey) => (
            <DocumentReviewCard
              key={docKey}
              shopId={shop.id}
              docKey={docKey}
              label={DOC_LABELS[docKey]}
              doc={shop.docs[docKey]}
            />
          ))}
        </div>
      </div>

      <ChatPanel shopId={shop.id} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="icon-tile size-8">
              <Gavel className="size-4" />
            </span>
            Keputusan akhir
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button disabled={verifyShop.isPending} onClick={handleApprove} className="gap-2">
            {verifyShop.isPending ? (
              <Spinner color="success" size="xs" label="Menyetujui..." />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Setujui toko
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger
              render={
                <Button variant="destructive" disabled={verifyShop.isPending} className="gap-2">
                  <XCircle className="size-4" />
                  Tolak toko
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tolak {shop.name}?</DialogTitle>
                <DialogDescription>
                  Catatan penolakan wajib diisi agar pemilik toko tahu apa yang perlu diperbaiki.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Alasan penolakan..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Batal</Button>} />
                <Button
                  variant="destructive"
                  disabled={!rejectNote.trim() || verifyShop.isPending}
                  onClick={handleReject}
                  className="gap-2"
                >
                  {verifyShop.isPending && <Spinner color="danger" size="xs" label="Menolak..." />}
                  Tolak toko
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
