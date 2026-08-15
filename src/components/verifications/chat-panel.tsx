"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Lock, MessageSquare } from "lucide-react";
import { Card } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useChatThread, useCloseChatThread, useSendChatMessage } from "@/lib/queries/chat";
import { getSafeErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

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
      onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal mengirim pesan")),
    });
  }

  function handleClose() {
    closeThread.mutate(undefined, {
      onSuccess: () => toast.success("Chat verifikasi ditutup"),
      onError: (err) => toast.error(getSafeErrorMessage(err, "Gagal menutup chat")),
    });
  }

  return (
    <Card className="glass-card">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="flex items-center gap-2 text-base text-foreground">
            <span className="icon-tile size-8">
              <MessageSquare className="size-4" />
            </span>
            Chat verifikasi
          </Card.Title>
          {!closed && (
            <Button
              size="sm"
              variant="outline"
              disabled={closeThread.isPending}
              onClick={handleClose}
              className="gap-1.5"
            >
              {closeThread.isPending ? (
                <Spinner color="pink" size="xs" label="Menutup chat..." />
              ) : (
                <Lock className="size-3.5" />
              )}
              Tutup chat
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Content className="gap-3">
        {isLoading && (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner color="dark" size="sm" label="Memuat percakapan..." />
            Memuat percakapan...
          </div>
        )}
        {isError && <p className="text-sm text-destructive">Gagal memuat percakapan.</p>}

        {data && (
          <div className="max-h-80 space-y-2.5 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
            {data.messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pesan.</p>
            )}
            {data.messages.map((msg, i) => {
              const isAdmin = msg.sender_role === "admin";
              const text = msg.message ?? msg.text ?? JSON.stringify(msg);
              return (
                <div
                  key={msg.id ?? i}
                  className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      isAdmin
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-background"
                    )}
                  >
                    {!isAdmin && (msg.sender_role || msg.sender_name) && (
                      <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground">
                        {msg.sender_name ?? msg.sender_role}
                      </p>
                    )}
                    <p className="break-words whitespace-pre-wrap">{text}</p>
                  </div>
                </div>
              );
            })}
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
              {sendMessage.isPending ? (
                <Spinner color="brand" size="xs" label="Mengirim..." />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
