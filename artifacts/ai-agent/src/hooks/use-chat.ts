import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  useCreateOpenaiConversation, 
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey
} from "@workspace/api-client-react";

export type LocalMedia = {
  id: string;
  type: "image";
  url: string;
  prompt: string;
  createdAt: string;
};

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMedia, setLocalMedia] = useState<Record<number, LocalMedia[]>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const addLocalMedia = useCallback((conversationId: number, media: Omit<LocalMedia, "id" | "createdAt">) => {
    setLocalMedia((prev) => {
      const current = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: [
          ...current,
          {
            ...media,
            id: Math.random().toString(36).substring(7),
            createdAt: new Date().toISOString(),
          }
        ]
      };
    });
  }, []);

  const sendMessage = async (content: string, existingConversationId: number | null) => {
    setIsStreaming(true);
    setStreamingContent("");
    abortControllerRef.current = new AbortController();

    let targetId = existingConversationId;

    try {
      // 1. Create conversation if it doesn't exist
      if (!targetId) {
        const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
        const newConv = await createConversation({ data: { title } });
        targetId = newConv.id;
        setLocation(`/c/${targetId}`);
        // Optimistically add to list cache
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }

      // Optimistically add user message to cache
      queryClient.setQueryData(
        getGetOpenaiConversationQueryKey(targetId),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [
              ...oldData.messages,
              {
                id: Date.now(), // Temp ID
                conversationId: targetId,
                role: "user",
                content,
                createdAt: new Date().toISOString(),
              }
            ]
          };
        }
      );

      // 2. Send message and read SSE stream
      const res = await fetch(`/api/openai/conversations/${targetId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (!dataStr || dataStr === "[DONE]") continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.done) {
                  done = true;
                } else if (data.content) {
                  setStreamingContent((prev) => prev + data.content);
                }
              } catch (e) {
                console.error("Failed to parse SSE chunk", dataStr, e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Chat error:", error);
      }
    } finally {
      setIsStreaming(false);
      if (targetId) {
        // Fetch the finalized messages from the server to get real IDs
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(targetId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    }
  };

  return { 
    sendMessage, 
    isStreaming, 
    streamingContent, 
    stopStreaming,
    localMedia,
    addLocalMedia
  };
}
