import { useState } from "react";
import { ImagePlus, Sparkles, X, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateOpenaiImage } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ImageGeneratorProps {
  onGenerated: (url: string, prompt: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function ImageGenerator({ onGenerated, isOpen, setIsOpen }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const { mutateAsync: generateImage, isPending } = useGenerateOpenaiImage();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isPending) return;

    try {
      const res = await generateImage({
        data: { prompt, size: "1024x1024" }
      });
      if (res.b64_json) {
        const url = `data:image/png;base64,${res.b64_json}`;
        onGenerated(url, prompt);
        setIsOpen(false);
        setPrompt("");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg"
          >
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold">Generate Image</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Describe what you want to see
                  </label>
                  <textarea
                    autoFocus
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic cyber-punk city in the rain at night, neon lights, 8k resolution, photorealistic..."
                    className="w-full h-32 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isPending}
                    className="relative overflow-hidden group px-6 py-2.5 rounded-xl font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/10 hover:shadow-white/20"
                  >
                    <div className="flex items-center gap-2">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      {isPending ? "Generating..." : "Create Magic"}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
