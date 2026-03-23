import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useCreateOpenaiConversation,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { loadSettings, buildSystemPrompt } from "@/components/SettingsDialog";

export type LocalMedia = {
  id: string;
  type: "image";
  url: string;
  prompt: string;
  createdAt: string;
};

interface ChatContextValue {
  isStreaming: boolean;
  streamingContent: string;
  localMedia: Record<number, LocalMedia[]>;
  sendMessage: (content: string, existingConversationId: number | null) => Promise<void>;
  stopStreaming: () => void;
  addLocalMedia: (conversationId: number, media: Omit<LocalMedia, "id" | "createdAt">) => void;
  addAndPersistImage: (conversationId: number, url: string, prompt: string) => Promise<void>;
  createConversationWithImage: (url: string, prompt: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
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

  const addLocalMedia = useCallback(
    (conversationId: number, media: Omit<LocalMedia, "id" | "createdAt">) => {
      setLocalMedia((prev) => {
        const current = prev[conversationId] ?? [];
        return {
          ...prev,
          [conversationId]: [
            ...current,
            {
              ...media,
              id: Math.random().toString(36).substring(7),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, existingConversationId: number | null) => {
      setIsStreaming(true);
      setStreamingContent("");
      abortControllerRef.current = new AbortController();

      let targetId = existingConversationId;

      try {
        if (!targetId) {
          const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
          const newConv = await createConversation({ data: { title } });
          targetId = newConv.id;
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setLocation(`/c/${targetId}`);
        }

        queryClient.setQueryData(
          getGetOpenaiConversationQueryKey(targetId),
          (oldData: Parameters<typeof queryClient.setQueryData>[1] extends (old: infer T) => unknown ? T : never) => {
            if (!oldData || typeof oldData !== "object") return oldData;
            const typed = oldData as {
              id: number;
              title: string;
              createdAt: string;
              messages: Array<{
                id: number;
                conversationId: number;
                role: string;
                content: string;
                createdAt: string;
              }>;
            };
            return {
              ...typed,
              messages: [
                ...typed.messages,
                {
                  id: Date.now(),
                  conversationId: targetId,
                  role: "user",
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          },
        );

        const settings = loadSettings();
        const systemPrompt = buildSystemPrompt(settings);

        const res = await fetch(`/api/openai/conversations/${targetId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, systemPrompt }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error("Failed to send message");
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let readerDone = false;
        let streamDone = false;
        let buffer = "";

        while (!readerDone && !streamDone) {
          const { value, done } = await reader.read();
          readerDone = done;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
          }

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trimEnd();
            buffer = buffer.slice(newlineIdx + 1);

            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr) as { content?: string; done?: boolean };
              if (data.done) {
                streamDone = true;
                break;
              } else if (data.content) {
                setStreamingContent((prev) => prev + data.content);
              }
            } catch {
              // Ignore malformed SSE chunks
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Chat error:", error);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        if (targetId) {
          queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(targetId) });
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        }
      }
    },
    [createConversation, queryClient, setLocation],
  );

  const addAndPersistImage = useCallback(
    async (conversationId: number, url: string, prompt: string) => {
      addLocalMedia(conversationId, { type: "image", url, prompt });
      await fetch(`/api/openai/conversations/${conversationId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
    },
    [addLocalMedia, queryClient],
  );

  const createConversationWithImage = useCallback(
    async (url: string, prompt: string) => {
      const title = prompt.length > 40 ? prompt.substring(0, 40) + "..." : prompt;
      const newConv = await createConversation({ data: { title } });
      const convId = newConv.id;
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });

      await fetch(`/api/openai/conversations/${convId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(convId) });
      addLocalMedia(convId, { type: "image", url, prompt });
      setLocation(`/c/${convId}`);
    },
    [createConversation, queryClient, addLocalMedia, setLocation],
  );

  return (
    <ChatContext.Provider
      value={{ isStreaming, streamingContent, localMedia, sendMessage, stopStreaming, addLocalMedia, addAndPersistImage, createConversationWithImage }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
