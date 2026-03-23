import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash2, RotateCcw, Bot, Sliders, Info } from "lucide-react";
import { useDeleteOpenaiConversation, useListOpenaiConversations, getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export const SETTINGS_KEY = "nexus_settings";

export interface NexusSettings {
  systemPrompt: string;
  responseStyle: "concise" | "balanced" | "detailed";
  streamingEnabled: boolean;
}

export const DEFAULT_SETTINGS: NexusSettings = {
  systemPrompt: "",
  responseStyle: "balanced",
  streamingEnabled: true,
};

export function loadSettings(): NexusSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<NexusSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: NexusSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function buildSystemPrompt(settings: NexusSettings): string {
  const styleInstructions: Record<NexusSettings["responseStyle"], string> = {
    concise: "Keep responses short and to the point. Avoid unnecessary elaboration.",
    balanced: "Be clear and helpful. Use moderate detail.",
    detailed:
      "Provide thorough, comprehensive responses. Include explanations, examples, and context.",
  };
  const base =
    settings.systemPrompt.trim() ||
    "You are an extremely capable AI Agent. You can help with any task: coding, writing, analysis, math, creative work, research, problem-solving, and image generation.";

  return `${base}\n\n${styleInstructions[settings.responseStyle]} Use markdown formatting when it improves readability.`;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<NexusSettings>(loadSettings);
  const [clearConfirm, setClearConfirm] = useState(false);
  const { data: conversations } = useListOpenaiConversations();
  const { mutate: deleteConv } = useDeleteOpenaiConversation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setSettings(loadSettings());
  }, [open]);

  const update = (patch: Partial<NexusSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    const ids = (conversations ?? []).map((c) => c.id);
    ids.forEach((id) => deleteConv({ id }));
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setClearConfirm(false);
  };

  const handleResetPrompt = () => {
    update({ systemPrompt: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setClearConfirm(false); }}>
      <DialogContent className="max-w-lg bg-[#0d0d12] border-white/10 text-white rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Model info */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Model</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Bot className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">GPT-5.2</p>
                <p className="text-xs text-white/40">Powered by Replit AI Integration</p>
              </div>
            </div>
          </section>

          {/* Response style */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Response Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["concise", "balanced", "detailed"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => update({ responseStyle: style })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                    settings.responseStyle === style
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">
              {settings.responseStyle === "concise" && "Short, direct answers without elaboration."}
              {settings.responseStyle === "balanced" && "Clear and helpful responses with appropriate detail."}
              {settings.responseStyle === "detailed" && "Comprehensive answers with explanations and examples."}
            </p>
          </section>

          {/* Streaming */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Behavior</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Streaming responses</p>
                <p className="text-xs text-white/40">Show tokens as they are generated</p>
              </div>
              <Switch
                checked={settings.streamingEnabled}
                onCheckedChange={(v) => update({ streamingEnabled: v })}
              />
            </div>
          </section>

          {/* Custom system prompt */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Custom Instructions</h3>
              {settings.systemPrompt && (
                <button
                  onClick={handleResetPrompt}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => update({ systemPrompt: e.target.value })}
              placeholder="Add custom instructions for the AI (optional). For example: 'Always respond in Spanish' or 'You are a senior Python engineer.'"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 resize-none transition-colors"
            />
            <div className="flex items-start gap-2 text-xs text-white/30">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              <p>These instructions are sent with every message and shape how the AI responds to you.</p>
            </div>
          </section>

          {/* Danger zone */}
          <section className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Data</h3>
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                clearConfirm
                  ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                  : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {clearConfirm ? "Click again to confirm — this cannot be undone" : "Clear all conversations"}
            </button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
