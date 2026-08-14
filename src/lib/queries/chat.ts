import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ChatThreadDetail } from "@/types/admin";

export function useChatThread(shopId: string) {
  return useQuery({
    queryKey: ["chat-thread", shopId],
    queryFn: () => apiFetch<ChatThreadDetail>(`/chat/threads/${shopId}`),
    enabled: !!shopId,
  });
}

export function useSendChatMessage(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch(`/chat/threads/${shopId}/messages`, {
        method: "POST",
        body: { message },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-thread", shopId] });
    },
  });
}

export function useCloseChatThread(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/chat/threads/${shopId}/close`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-thread", shopId] });
      queryClient.invalidateQueries({ queryKey: ["pending-shops"] });
    },
  });
}
