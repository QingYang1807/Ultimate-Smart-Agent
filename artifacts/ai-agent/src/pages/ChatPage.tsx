import { useState } from "react";
import { useParams } from "wouter";
import { useGetOpenaiConversation } from "@workspace/api-client-react";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { useChat } from "@/context/ChatContext";
import { ImageGenerator } from "@/components/ImageGenerator";
import { Loader2 } from "lucide-react";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id, 10);

  const { data: conversation, isLoading } = useGetOpenaiConversation(conversationId, {
    query: {
      enabled: !isNaN(conversationId),
      queryKey: ["openai", "conversations", conversationId],
    },
  });

  const { sendMessage, isStreaming, streamingContent, stopStreaming, localMedia, addLocalMedia } =
    useChat();

  const [imageGenOpen, setImageGenOpen] = useState(false);

  const handleSend = (text: string) => {
    sendMessage(text, conversationId);
  };

  const handleImageGenerated = (url: string, prompt: string) => {
    addLocalMedia(conversationId, { type: "image", url, prompt });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      <MessageList
        messages={conversation?.messages ?? []}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        localMedia={localMedia[conversationId] ?? []}
      />

      <div className="mt-auto">
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          onOpenImageGen={() => setImageGenOpen(true)}
        />
      </div>

      <ImageGenerator
        isOpen={imageGenOpen}
        setIsOpen={setImageGenOpen}
        onGenerated={handleImageGenerated}
      />
    </div>
  );
}
