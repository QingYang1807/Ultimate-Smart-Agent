export interface ProviderMeta {
  id: string;
  name: string;
  color: string;
  defaultBaseUrl: string;
  popularModels: string[];
  compatible: boolean;
  description?: string;
}

export const PROVIDERS_REGISTRY: ProviderMeta[] = [
  {
    id: "replit",
    name: "Replit AI",
    color: "#F26207",
    defaultBaseUrl: "",
    popularModels: ["gpt-5.2"],
    compatible: true,
    description: "Built-in Replit AI Integration — no API key needed",
  },
  {
    id: "openai",
    name: "OpenAI",
    color: "#10A37F",
    defaultBaseUrl: "https://api.openai.com/v1",
    popularModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini", "o3-mini"],
    compatible: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    color: "#CC785C",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    popularModels: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-3-5-haiku-latest"],
    compatible: true,
    description: "OpenAI-compatible endpoint via proxy",
  },
  {
    id: "gemini",
    name: "Gemini",
    color: "#4285F4",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    popularModels: ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"],
    compatible: true,
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    color: "#0078D4",
    defaultBaseUrl: "https://{resource}.openai.azure.com/openai/deployments/{deployment}",
    popularModels: ["gpt-4o", "gpt-4-turbo", "gpt-35-turbo"],
    compatible: true,
  },
  {
    id: "vertex-ai",
    name: "Vertex AI",
    color: "#34A853",
    defaultBaseUrl: "https://us-central1-aiplatform.googleapis.com/v1/projects/{project}/locations/us-central1/endpoints/openapi",
    popularModels: ["gemini-2.0-flash-001", "gemini-1.5-pro-001"],
    compatible: true,
  },
  {
    id: "groq",
    name: "Groq",
    color: "#F55036",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    popularModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    compatible: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    color: "#6366F1",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    popularModels: ["meta-llama/llama-3.3-70b-instruct", "google/gemini-2.0-flash-001", "anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
    compatible: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    color: "#1FB8CD",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    popularModels: ["deepseek-chat", "deepseek-reasoner"],
    compatible: true,
  },
  {
    id: "mistral",
    name: "Mistral",
    color: "#FF6F00",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    popularModels: ["mistral-large-latest", "mistral-small-latest", "codestral-latest", "open-mixtral-8x22b"],
    compatible: true,
  },
  {
    id: "together",
    name: "Together AI",
    color: "#4F46E5",
    defaultBaseUrl: "https://api.together.xyz/v1",
    popularModels: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
    compatible: true,
  },
  {
    id: "fireworks",
    name: "Fireworks",
    color: "#EF4444",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    popularModels: ["accounts/fireworks/models/llama-v3p3-70b-instruct", "accounts/fireworks/models/mixtral-8x22b-instruct"],
    compatible: true,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    color: "#20B2AA",
    defaultBaseUrl: "https://api.perplexity.ai",
    popularModels: ["sonar-pro", "sonar", "sonar-reasoning-pro", "sonar-reasoning"],
    compatible: true,
  },
  {
    id: "xai",
    name: "xAI / Grok",
    color: "#1A1A1A",
    defaultBaseUrl: "https://api.x.ai/v1",
    popularModels: ["grok-3", "grok-3-mini", "grok-2-1212"],
    compatible: true,
  },
  {
    id: "cohere",
    name: "Cohere",
    color: "#39594D",
    defaultBaseUrl: "https://api.cohere.ai/compatibility/v1",
    popularModels: ["command-r-plus-08-2024", "command-r-08-2024", "command-r7b-12-2024"],
    compatible: true,
  },
  {
    id: "moonshot",
    name: "Moonshot / 月之暗面",
    color: "#6366F1",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    popularModels: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    compatible: true,
  },
  {
    id: "minimax",
    name: "MiniMax",
    color: "#FF5C5C",
    defaultBaseUrl: "https://api.minimax.chat/v1",
    popularModels: ["abab6.5s-chat", "abab5.5-chat"],
    compatible: true,
  },
  {
    id: "minimax-global",
    name: "MiniMax (Global)",
    color: "#FF5C5C",
    defaultBaseUrl: "https://api.minimaxi.chat/v1",
    popularModels: ["MiniMax-Text-01", "abab6.5s-chat"],
    compatible: true,
  },
  {
    id: "zhipu",
    name: "智谱 / ZhipuAI",
    color: "#3B82F6",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    popularModels: ["glm-4-plus", "glm-4-air", "glm-4-flash"],
    compatible: true,
  },
  {
    id: "qianfan",
    name: "百度千帆",
    color: "#3B6DC4",
    defaultBaseUrl: "https://qianfan.baidubce.com/v2",
    popularModels: ["ernie-speed-128k", "ernie-lite-8k"],
    compatible: true,
  },
  {
    id: "qwen",
    name: "阿里云 Qwen / 通义千问",
    color: "#FF6A00",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    popularModels: ["qwen-max", "qwen-plus", "qwen-turbo", "qwq-32b"],
    compatible: true,
  },
  {
    id: "lingyiwanwu",
    name: "零一万物",
    color: "#8B5CF6",
    defaultBaseUrl: "https://api.lingyiwanwu.com/v1",
    popularModels: ["yi-lightning", "yi-large", "yi-medium"],
    compatible: true,
  },
  {
    id: "stepfun",
    name: "阶跃星辰 / StepFun",
    color: "#06B6D4",
    defaultBaseUrl: "https://api.stepfun.com/v1",
    popularModels: ["step-2-16k", "step-1-8k"],
    compatible: true,
  },
  {
    id: "tencent-hunyuan",
    name: "腾讯混元",
    color: "#0052D9",
    defaultBaseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
    popularModels: ["hunyuan-turbos", "hunyuan-large"],
    compatible: true,
  },
  {
    id: "siliconflow",
    name: "硅基流动 / SiliconFlow",
    color: "#6366F1",
    defaultBaseUrl: "https://api.siliconflow.cn/v1",
    popularModels: ["deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct", "meta-llama/Meta-Llama-3.1-8B-Instruct"],
    compatible: true,
  },
  {
    id: "ollama",
    name: "Ollama",
    color: "#000000",
    defaultBaseUrl: "http://localhost:11434/v1",
    popularModels: ["llama3.2", "llama3.1", "mistral", "gemma3", "qwen2.5", "deepseek-r1"],
    compatible: true,
    description: "Run models locally with Ollama",
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    color: "#A855F7",
    defaultBaseUrl: "http://localhost:1234/v1",
    popularModels: ["lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF"],
    compatible: true,
    description: "Run models locally with LM Studio",
  },
  {
    id: "github-models",
    name: "GitHub Models",
    color: "#24292E",
    defaultBaseUrl: "https://models.inference.ai.azure.com",
    popularModels: ["gpt-4o", "Meta-Llama-3.1-70B-Instruct", "Mistral-large"],
    compatible: true,
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    color: "#76B900",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    popularModels: ["meta/llama-3.3-70b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct"],
    compatible: true,
  },
  {
    id: "cerebras",
    name: "Cerebras AI",
    color: "#FF4500",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    popularModels: ["llama3.1-70b", "llama3.1-8b"],
    compatible: true,
  },
  {
    id: "hyperbolic",
    name: "Hyperbolic",
    color: "#7C3AED",
    defaultBaseUrl: "https://api.hyperbolic.xyz/v1",
    popularModels: ["meta-llama/Llama-3.3-70B-Instruct", "deepseek-ai/DeepSeek-R1"],
    compatible: true,
  },
  {
    id: "voyage",
    name: "Voyage AI",
    color: "#0EA5E9",
    defaultBaseUrl: "https://api.voyageai.com/v1",
    popularModels: ["voyage-3-large", "voyage-3"],
    compatible: true,
  },
  {
    id: "jina",
    name: "Jina AI",
    color: "#10B981",
    defaultBaseUrl: "https://api.jina.ai/v1",
    popularModels: ["jina-embeddings-v3"],
    compatible: true,
  },
  {
    id: "modelscope",
    name: "ModelScope 魔搭",
    color: "#8B5CF6",
    defaultBaseUrl: "https://api-inference.modelscope.cn/v1",
    popularModels: ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1"],
    compatible: true,
  },
  {
    id: "gpustack",
    name: "GPUStack",
    color: "#059669",
    defaultBaseUrl: "http://your-gpustack-server/v1-openai",
    popularModels: ["llama-3.3-70b", "qwen2.5-72b"],
    compatible: true,
  },
  {
    id: "vercel",
    name: "Vercel AI Gateway",
    color: "#000000",
    defaultBaseUrl: "https://ai-gateway.vercel.sh",
    popularModels: ["gpt-4o", "claude-3-5-sonnet"],
    compatible: true,
  },
  {
    id: "cloudflare",
    name: "Cloudflare AI",
    color: "#F48120",
    defaultBaseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1",
    popularModels: ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/mistral/mistral-7b-instruct-v0.1"],
    compatible: true,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    color: "#FFD21E",
    defaultBaseUrl: "https://api-inference.huggingface.co/models",
    popularModels: ["meta-llama/Meta-Llama-3-8B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
    compatible: true,
  },
  {
    id: "aws-bedrock",
    name: "AWS Bedrock",
    color: "#FF9900",
    defaultBaseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    popularModels: ["anthropic.claude-3-5-sonnet-20241022-v2:0", "amazon.nova-pro-v1:0"],
    compatible: false,
    description: "Coming soon — requires native AWS SDK",
  },
  {
    id: "new-api",
    name: "New API",
    color: "#3B82F6",
    defaultBaseUrl: "https://your-new-api-host/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet"],
    compatible: true,
    description: "Self-hosted OpenAI-compatible gateway",
  },
  {
    id: "302-ai",
    name: "302.AI",
    color: "#6366F1",
    defaultBaseUrl: "https://api.302.ai/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"],
    compatible: true,
  },
  {
    id: "dmxapi",
    name: "DMXAPI",
    color: "#EF4444",
    defaultBaseUrl: "https://www.dmxapi.cn/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet"],
    compatible: true,
  },
  {
    id: "aihubmix",
    name: "AIHubMix",
    color: "#8B5CF6",
    defaultBaseUrl: "https://aihubmix.com/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"],
    compatible: true,
  },
  {
    id: "burncloud",
    name: "BurnCloud",
    color: "#F97316",
    defaultBaseUrl: "https://burn.hair/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet"],
    compatible: true,
  },
  {
    id: "tokenflux",
    name: "TokenFlux",
    color: "#14B8A6",
    defaultBaseUrl: "https://tokenflux.ai/v1",
    popularModels: ["gpt-4o", "claude-3-5-sonnet"],
    compatible: true,
  },
];

export function getProviderById(id: string): ProviderMeta | undefined {
  return PROVIDERS_REGISTRY.find((p) => p.id === id);
}

export const ACTIVE_MODEL_KEY = "nexus_active_model";

export interface ActiveModelSelection {
  providerId: string;
  model: string;
}

export function loadActiveModel(): ActiveModelSelection {
  try {
    const raw = localStorage.getItem(ACTIVE_MODEL_KEY);
    if (!raw) return { providerId: "replit", model: "gpt-5.2" };
    return JSON.parse(raw) as ActiveModelSelection;
  } catch {
    return { providerId: "replit", model: "gpt-5.2" };
  }
}

export function saveActiveModel(selection: ActiveModelSelection): void {
  localStorage.setItem(ACTIVE_MODEL_KEY, JSON.stringify(selection));
}
