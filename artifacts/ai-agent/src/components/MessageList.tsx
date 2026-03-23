import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Image as ImageIcon } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils";
import type { OpenaiMessage } from "@workspace/api-client-react";
import type { LocalMedia } from "@/hooks/use-chat";

interface MessageListProps {
  messages: OpenaiMessage[];
  streamingContent: string;
  isStreaming: boolean;
  localMedia?: LocalMedia[];
}

export function MessageList({ messages, streamingContent, isStreaming, localMedia = [] }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, localMedia]);

  const aiAvatarUrl = `${import.meta.env.BASE_URL}images/ai-avatar.png`;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth relative">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={msg.id || `msg-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex w-full max-w-4xl mx-auto gap-4", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div className="shrink-0 pt-1">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                    <User className="w-4 h-4 text-white/70" />
                  </div>
                ) : (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-primary/20">
                    <img src={aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className={cn(
                "relative group max-w-[85%]",
                isUser ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-5 py-3.5 rounded-2xl text-[15px] shadow-sm",
                  isUser 
                    ? "bg-gradient-to-br from-primary to-[#7c3aed] text-white rounded-tr-sm shadow-primary/20" 
                    : "glass-panel rounded-tl-sm text-white/90"
                )}>
                  {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Local Media (Generated Images) injected into timeline */}
        {localMedia.map((media) => (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-4xl mx-auto gap-4 flex-row"
          >
            <div className="shrink-0 pt-1">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-primary/20">
                <img src={aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="glass-panel p-2 rounded-2xl rounded-tl-sm max-w-sm w-full">
              <div className="relative group rounded-xl overflow-hidden bg-black/50 aspect-square">
                <img src={media.url} alt={media.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-xs text-white/80 line-clamp-3">{media.prompt}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Streaming Bubble */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-4xl mx-auto gap-4 flex-row"
          >
             <div className="shrink-0 pt-1">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-primary/50 animate-pulse">
                  <img src={aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="glass-panel px-5 py-3.5 rounded-2xl rounded-tl-sm text-[15px] text-white/90 min-w-[60px] max-w-[85%]">
                {streamingContent ? (
                   <MarkdownRenderer content={streamingContent} />
                ) : (
                  <div className="flex items-center h-6 gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
