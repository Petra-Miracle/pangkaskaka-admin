"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatThread, useCloseChatThread, useSendChatMessage } from "@/lib/queries/chat";
import { ApiError } from "@/lib/api";

export function ChatPanel({ shopId }: { shopId: string }) {
  const { data, isLoading, isError } = useChatThread(shopId);
  const sendMessage = useSendChatMessage(shopId);
  const closeThread = useCloseChatThread(shopId);
  const [draft, setDraft] = useState("");

  const closed = data?.shop?.closed ?? false;

  function handleSend() {
    if (!draft.trim()) return;
    sendMessage.mutate(draft.trim(), {
      onSuccess: () => setDraft(""),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gagal mengirim pesan"),
    });
  }

  function handleClose() {
    closeThread.mutate(undefined, {
      onSuccess: () => toast.success("Chat verifikasi ditutup"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gagal menutup chat"),
    });
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Chat verifikasi</CardTitle>
          {!closed && (
            <Button size="sm" variant="outline" disabled={closeThread.isPending} onClick={handleClose}>
              <Lock className="size-3.5" />
              Tutup chat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {isError && <p className="text-sm text-destructive">Gagal memuat percakapan.</p>}

        {data && (
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
            {data.messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pesan.</p>
            )}
            {data.messages.map((msg, i) => (
              <div key={msg.id ?? i} className="rounded-md bg-background p-2 text-sm shadow-sm">
                {(msg.sender_role || msg.sender_name) && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {msg.sender_name ?? msg.sender_role}
                  </p>
                )}
                <p>{msg.message ?? msg.text ?? JSON.stringify(msg)}</p>
              </div>
            ))}
          </div>
        )}

        {closed ? (
          <p className="text-sm text-muted-foreground">Chat ini sudah ditutup.</p>
        ) : (
          <div className="flex gap-2">
            <Textarea
              placeholder="Tulis pesan ke pemilik toko..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              size="icon"
              disabled={sendMessage.isPending || !draft.trim()}
              onClick={handleSend}
              className="self-end"
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
