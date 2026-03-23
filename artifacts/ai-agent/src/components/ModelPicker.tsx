import { useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useListProviderConfigs, getListProviderConfigsQueryKey } from "@workspace/api-client-react";
import { PROVIDERS_REGISTRY, getProviderById, saveActiveModel, loadActiveModel } from "@/lib/providers-registry";
import type { ActiveModelSelection } from "@/lib/providers-registry";

export const ACTIVE_MODEL_CHANGE_EVENT = "nexus:activeModelChange";

export function dispatchActiveModelChange(selection: ActiveModelSelection) {
  saveActiveModel(selection);
  window.dispatchEvent(new CustomEvent(ACTIVE_MODEL_CHANGE_EVENT, { detail: selection }));
}

interface ModelPickerProps {
  activeModel: ActiveModelSelection;
  onModelChange: (selection: ActiveModelSelection) => void;
}

function ProviderColor({ providerId }: { providerId: string }) {
  const provider = getProviderById(providerId);
  const color = provider?.color === "#000000" || provider?.color === "#1A1A1A" ? "#333" : (provider?.color ?? "#F26207");
  return (
    <div
      className="w-4 h-4 rounded-sm shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
      style={{ backgroundColor: color }}
    >
      {(provider?.name ?? "R").slice(0, 1)}
    </div>
  );
}

export function ModelPicker({ activeModel, onModelChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: configs = [], isLoading } = useListProviderConfigs();

  const enabledConfigs = configs.filter((c) => c.enabled && c.apiKey);

  const handleSelect = (selection: ActiveModelSelection) => {
    onModelChange(selection);
    dispatchActiveModelChange(selection);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch active model"
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <ProviderColor providerId={activeModel.providerId} />
        <span className="truncate flex-1 text-left font-mono">{activeModel.model}</span>
        <ChevronDown className={`w-3 h-3 opacity-40 group-hover:opacity-70 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#0d0d12] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />
                </div>
              ) : (
                <>
                  {/* Replit AI built-in */}
                  <div className="px-2 pt-1 pb-0.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Replit AI</p>
                  </div>
                  {PROVIDERS_REGISTRY.find((p) => p.id === "replit")?.popularModels.map((model) => {
                    const isActive = activeModel.providerId === "replit" && activeModel.model === model;
                    return (
                      <button
                        key={`replit-${model}`}
                        onClick={() => handleSelect({ providerId: "replit", model })}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive ? "bg-primary/15 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <ProviderColor providerId="replit" />
                        <span className="font-mono flex-1 text-left truncate">{model}</span>
                        {isActive && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Enabled custom providers */}
                  {enabledConfigs.map((config) => {
                    const provider = getProviderById(config.providerId);
                    if (!provider) return null;
                    const models = config.selectedModel
                      ? [config.selectedModel, ...provider.popularModels.filter((m) => m !== config.selectedModel)]
                      : provider.popularModels;

                    return (
                      <div key={config.providerId}>
                        <div className="px-2 pt-2 pb-0.5">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{provider.name}</p>
                        </div>
                        {models.slice(0, 5).map((model) => {
                          const isActive = activeModel.providerId === config.providerId && activeModel.model === model;
                          return (
                            <button
                              key={`${config.providerId}-${model}`}
                              onClick={() => handleSelect({ providerId: config.providerId, model })}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                isActive ? "bg-primary/15 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <ProviderColor providerId={config.providerId} />
                              <span className="font-mono flex-1 text-left truncate">{model}</span>
                              {isActive && <Check className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {enabledConfigs.length === 0 && (
                    <p className="text-[10px] text-white/25 px-2 py-2">
                      Enable providers in Settings → Providers to switch models.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
