import { Sparkles, Code2, PenTool, Database } from "lucide-react";
import { ChatInput } from "@/components/ChatInput";
import { useChat } from "@/hooks/use-chat";
import { ImageGenerator } from "@/components/ImageGenerator";
import { useState } from "react";

const SUGGESTIONS = [
  { icon: Code2, text: "Write a React hook for websockets" },
  { icon: PenTool, text: "Draft a product launch blog post" },
  { icon: Database, text: "Optimize a slow SQL query" },
  { icon: Sparkles, text: "Explain quantum computing simply" },
];

export function HomePage() {
  const { sendMessage, isStreaming, stopStreaming } = useChat();
  const [imageGenOpen, setImageGenOpen] = useState(false);

  const handleSend = (text: string) => {
    sendMessage(text, null);
  };

  const bgUrl = `${import.meta.env.BASE_URL}images/empty-bg.png`;
  const logoUrl = `${import.meta.env.BASE_URL}images/ai-avatar.png`;

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="w-20 h-20 mb-8 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.4)] border border-primary/30">
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 text-center">
          How can I help you today?
        </h1>
        <p className="text-lg text-white/50 mb-12 max-w-xl text-center font-medium">
          I'm Nexus, your advanced AI assistant powered by GPT-5.2. I can write code, analyze data, and generate images.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                className="flex items-center gap-4 p-4 glass-panel hover:bg-white/10 transition-all rounded-2xl text-left group"
              >
                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-white/60">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  {s.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-20 w-full mt-auto">
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
        onGenerated={() => {
           // On home page, we can't save the image easily without a conversation.
           // Ideally we create a conversation first. Let's just create one with a dummy message.
           sendMessage("Generate an image based on the prompt provided in the dialog.", null);
        }}
      />
    </div>
  );
}
