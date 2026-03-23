import { useState, useMemo, useEffect } from "react";
import { Search, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useListProviderConfigs,
  useUpsertProviderConfig,
  getListProviderConfigsQueryKey,
} from "@workspace/api-client-react";
import type { ProviderConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PROVIDERS_REGISTRY,
  getProviderById,
  saveActiveModel,
  loadActiveModel,
} from "@/lib/providers-registry";
import type { ProviderMeta } from "@/lib/providers-registry";

function ProviderAvatar({ provider }: { provider: ProviderMeta }) {
  const initials = provider.name
    .split(/[\s\/]/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: provider.color === "#000000" || provider.color === "#1A1A1A" ? "#333" : provider.color }}
    >
      {initials}
    </div>
  );
}

interface ProviderRowProps {
  provider: ProviderMeta;
  config?: ProviderConfig;
  isSelected: boolean;
  onClick: () => void;
  onToggle: (enabled: boolean) => void;
}

function ProviderRow({ provider, config, isSelected, onClick, onToggle }: ProviderRowProps) {
  const hasKey = !!config?.apiKey;
  const isEnabled = config?.enabled ?? false;

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        isSelected ? "bg-primary/15 border border-primary/30" : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <ProviderAvatar provider={provider} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-white/80"}`}>
          {provider.name}
        </p>
        {provider.id === "replit" && (
          <p className="text-[10px] text-primary/60">Built-in</p>
        )}
      </div>
      {!provider.compatible && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 shrink-0">Soon</span>
      )}
      {provider.id !== "replit" && provider.compatible && (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="shrink-0"
        >
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            disabled={!hasKey}
          />
        </div>
      )}
      {provider.id === "replit" && (
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
      )}
    </button>
  );
}

interface ProviderPanelProps {
  provider: ProviderMeta;
  config?: ProviderConfig;
  onSave: (data: { apiKey?: string | null; baseUrl?: string | null; enabled?: boolean; selectedModel?: string | null }) => void;
  isSaving: boolean;
}

function ProviderPanel({ provider, config, onSave, isSaving }: ProviderPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? provider.defaultBaseUrl);
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const activeModel = loadActiveModel();

  useEffect(() => {
    setApiKey("");
    setShowKey(false);
    setSaveSuccess(false);
    setBaseUrl(config?.baseUrl ?? provider.defaultBaseUrl);
  }, [provider.id, config?.baseUrl, provider.defaultBaseUrl]);

  const hasExistingKey = !!config?.apiKey;
  const keyPlaceholder = hasExistingKey ? "••••••••••••••••" : "Enter API key...";

  const handleSave = () => {
    const data: { apiKey?: string | null; baseUrl?: string | null } = {
      baseUrl: baseUrl || null,
    };
    if (apiKey.trim()) {
      data.apiKey = apiKey.trim();
    }
    onSave(data);
    setApiKey("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRemoveKey = () => {
    onSave({ apiKey: null });
    setApiKey("");
  };

  const handleModelSelect = (model: string) => {
    onSave({ selectedModel: model });
    if (config?.enabled || provider.id === "replit") {
      saveActiveModel({ providerId: provider.id, model });
    }
  };

  if (provider.id === "replit") {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1">Built-in Replit AI Integration</p>
          <p className="text-xs text-white/50">No API key required. Powered by Replit AI Integrations — GPT-5.2 and gpt-image-1 are available automatically.</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Available Models</p>
          <div className="space-y-1">
            {provider.popularModels.map((model) => (
              <button
                key={model}
                onClick={() => handleModelSelect(model)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeModel.providerId === "replit" && activeModel.model === model
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                {model}
                {activeModel.providerId === "replit" && activeModel.model === model && (
                  <span className="ml-2 text-xs text-primary/70">● active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!provider.compatible) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-medium text-amber-400">Coming Soon</p>
        </div>
        <p className="text-xs text-white/50">{provider.description ?? `Native ${provider.name} SDK support is planned for a future release.`}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {provider.description && (
        <p className="text-xs text-white/40 italic">{provider.description}</p>
      )}

      {/* API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">API Key</label>
          {hasExistingKey && (
            <button
              onClick={handleRemoveKey}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keyPlaceholder}
            className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">API Base URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={provider.defaultBaseUrl}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors font-mono text-xs"
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || (!apiKey.trim() && baseUrl === (config?.baseUrl ?? provider.defaultBaseUrl))}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          saveSuccess
            ? "bg-green-500/20 border border-green-500/30 text-green-400"
            : "bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
      >
        {isSaving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saveSuccess ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved!</>
        ) : (
          "Save Configuration"
        )}
      </button>

      {/* Models */}
      {provider.popularModels.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Select Model</p>
          {!hasExistingKey && (
            <p className="text-xs text-amber-400/70">Add an API key to enable this provider and select a model</p>
          )}
          <div className="space-y-1">
            {provider.popularModels.map((model) => {
              const isActive = activeModel.providerId === provider.id && activeModel.model === model;
              const isSelected = config?.selectedModel === model;
              return (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  disabled={!hasExistingKey || !config?.enabled}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : isSelected
                      ? "bg-white/10 text-white/80 border border-white/10"
                      : "text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  <span className="truncate block">{model}</span>
                  {isActive && <span className="text-[9px] text-primary/70 not-italic font-sans">● active</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-white/20">Toggle the provider on to select a model as active.</p>
        </div>
      )}
    </div>
  );
}

export function ProvidersTab() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("replit");
  const { data: configs = [], isLoading } = useListProviderConfigs();
  const { mutate: upsert, isPending: isSaving } = useUpsertProviderConfig();
  const queryClient = useQueryClient();

  const configMap = useMemo(() => {
    const m = new Map<string, ProviderConfig>();
    for (const c of configs) m.set(c.providerId, c);
    return m;
  }, [configs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return PROVIDERS_REGISTRY;
    const q = search.toLowerCase();
    return PROVIDERS_REGISTRY.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedProvider = getProviderById(selectedId) ?? PROVIDERS_REGISTRY[0];
  const selectedConfig = configMap.get(selectedId);

  const handleSave = (data: {
    apiKey?: string | null;
    baseUrl?: string | null;
    enabled?: boolean;
    selectedModel?: string | null;
  }) => {
    upsert(
      { providerId: selectedId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProviderConfigsQueryKey() });
        },
      },
    );
  };

  const handleToggle = (providerId: string, enabled: boolean) => {
    upsert(
      { providerId, data: { enabled } },
      {
        onSuccess: (updatedConfig) => {
          queryClient.invalidateQueries({ queryKey: getListProviderConfigsQueryKey() });
          if (enabled) {
            const provider = getProviderById(providerId);
            const model = updatedConfig.selectedModel ?? provider?.popularModels[0] ?? "gpt-4o";
            saveActiveModel({ providerId, model });
          } else {
            const currentActive = loadActiveModel();
            if (currentActive.providerId === providerId) {
              saveActiveModel({ providerId: "replit", model: "gpt-5.2" });
            }
          }
        },
      },
    );
  };

  const enabledCount = configs.filter((c) => c.enabled).length;

  return (
    <div className="flex gap-0 h-[520px] -mx-6 -mb-5">
      {/* Left sidebar */}
      <div className="w-52 shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 placeholder:text-white/25 focus:outline-none focus:border-primary/30 transition-colors"
            />
          </div>
          {enabledCount > 0 && (
            <p className="text-[10px] text-primary/60 mt-1.5 px-1">
              {enabledCount} provider{enabledCount !== 1 ? "s" : ""} enabled
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-white/30" />
            </div>
          ) : (
            filtered.map((provider) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                config={configMap.get(provider.id)}
                isSelected={selectedId === provider.id}
                onClick={() => setSelectedId(provider.id)}
                onToggle={(enabled) => handleToggle(provider.id, enabled)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 p-5 overflow-y-auto">
        {selectedProvider && (
          <>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
              <ProviderAvatar provider={selectedProvider} />
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedProvider.name}</h3>
                <p className="text-xs text-white/40 font-mono">{selectedProvider.defaultBaseUrl || "Built-in"}</p>
              </div>
            </div>
            <ProviderPanel
              provider={selectedProvider}
              config={selectedConfig}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </>
        )}
      </div>
    </div>
  );
}
