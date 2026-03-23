import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Send, Image as ImageIcon, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  onOpenImageGen: () => void;
}

export function ChatInput({ onSend, isStreaming, onStop, onOpenImageGen }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isStreaming) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto focus on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-10">
      <div className="max-w-4xl mx-auto relative">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 glass-panel p-2 rounded-3xl"
        >
          <button
            type="button"
            onClick={onOpenImageGen}
            disabled={isStreaming}
            className="p-3 shrink-0 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
            title="Generate Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <TextareaAutosize
            ref={textareaRef}
            minRows={1}
            maxRows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Shift+Enter for newline)"
            className="w-full py-3 bg-transparent text-white placeholder:text-white/30 focus:outline-none resize-none text-[15px] leading-relaxed"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="p-3 shrink-0 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center h-[46px] w-[46px]"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                "p-3 shrink-0 rounded-2xl transition-all duration-300 flex items-center justify-center h-[46px] w-[46px]",
                input.trim() 
                  ? "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105" 
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          )}
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-white/30 font-medium">
            AI Agent uses GPT-5.2. Information may be inaccurate.
          </p>
        </div>
      </div>
    </div>
  );
}
