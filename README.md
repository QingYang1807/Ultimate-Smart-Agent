# Nexus.ai

A full-stack AI Agent web application powered by GPT-5.2 via Replit AI Integrations. Nexus.ai features real-time streaming conversations, persistent multi-turn chat history, image generation, and a comprehensive multi-provider configuration system supporting ~45 AI providers — inspired by Cherry Studio.

---

## Features

- **Streaming chat** — Server-Sent Events (SSE) deliver AI tokens to the browser as they are generated, with a stop button to cancel mid-stream.
- **Multi-turn context** — Full conversation history is sent on every request so the model has complete context.
- **Persistent storage** — Conversations and messages are stored in PostgreSQL; they survive page reloads.
- **Image generation** — Generate images with `gpt-image-1` directly from the chat input. Images are persisted per conversation.
- **45-provider support** — Cherry Studio-style two-pane provider management covering every major AI platform. API keys are stored server-side in the database (never in the browser).
- **Dynamic model routing** — Each message is routed to the correct provider and model at request time using a per-request OpenAI-compatible client.
- **Model picker** — A compact inline popover in the sidebar lets you switch provider + model without opening Settings.
- **Customizable settings** — System prompt, response style (concise / balanced / detailed), and streaming toggle, all persisted in `localStorage`.
- **Professional dark-mode UI** — Tailwind CSS + shadcn/ui components with a custom deep-dark palette.
- **SSRF protection** — Cloud metadata endpoints are always blocked; private/loopback IPs are blocked in production, allowed in development for local inference servers (Ollama, LM Studio).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Routing | Wouter |
| Data fetching | TanStack Query (React Query) |
| Backend | Express 5 (Node.js 24) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API codegen | Orval (OpenAPI → React Query hooks + Zod schemas) |
| AI | OpenAI-compatible SDK via Replit AI Integrations |
| Build | esbuild (API server CJS bundle), Vite (frontend) |

---

## Project Structure

```
nexus-ai/
├── artifacts/
│   ├── ai-agent/                   # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ChatInput.tsx         # Message input + image generation trigger
│   │       │   ├── ChatMessage.tsx       # Individual message bubble (Markdown + images)
│   │       │   ├── ImageGenerator.tsx    # Image generation dialog
│   │       │   ├── MarkdownRenderer.tsx  # Syntax-highlighted Markdown
│   │       │   ├── MessageList.tsx       # Scrollable message thread
│   │       │   ├── ModelPicker.tsx       # Inline model switcher popover
│   │       │   ├── ProvidersTab.tsx      # Cherry Studio-style provider config UI
│   │       │   ├── SettingsDialog.tsx    # Settings modal (General + Providers tabs)
│   │       │   └── Sidebar.tsx           # Conversation list + model picker
│   │       ├── context/
│   │       │   └── ChatContext.tsx       # SSE streaming state + send/stop/image logic
│   │       ├── lib/
│   │       │   └── providers-registry.ts # 45-provider registry + localStorage helpers
│   │       └── pages/
│   │           ├── HomePage.tsx          # Landing / new chat
│   │           └── ChatPage.tsx          # Active conversation view
│   └── api-server/                 # Express 5 API server
│       └── src/
│           ├── routes/
│           │   ├── health.ts             # GET /api/healthz
│           │   ├── providers.ts          # Provider config CRUD
│           │   └── openai/
│           │       ├── conversations.ts  # Conversation CRUD + SSE streaming
│           │       └── image.ts          # Image generation endpoint
│           └── lib/
│               ├── validate-base-url.ts  # SSRF validation
│               └── validate-base-url.test.ts  # 15 unit tests
├── lib/
│   ├── api-spec/                   # OpenAPI 3.1 spec + Orval config
│   ├── api-client-react/           # Generated React Query hooks
│   ├── api-zod/                    # Generated Zod request/response schemas
│   ├── db/                         # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/   # Server-side OpenAI SDK wrapper
│   └── integrations-openai-ai-react/    # React hooks for OpenAI audio
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

---

## Database Schema

### `conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Auto-increment |
| `title` | text | First 40 chars of the opening message |
| `created_at` | timestamptz | Auto-set on insert |

### `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `conversation_id` | integer FK | Cascades on delete |
| `role` | text | `user`, `assistant`, or `image` |
| `content` | text | Plain text or JSON (`{"prompt":"..."}` for images) |
| `created_at` | timestamptz | |

### `provider_configs`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `provider_id` | text UNIQUE | e.g. `openai`, `groq`, `ollama` |
| `api_key` | text nullable | Stored server-side; masked as `••••••••` in all API responses |
| `base_url` | text nullable | Custom endpoint, SSRF-validated on write |
| `enabled` | boolean | Only enabled providers appear in the model picker |
| `selected_model` | text nullable | Last model chosen for this provider |
| `created_at` / `updated_at` | timestamptz | |

---

## API Reference

All routes are mounted under `/api`.

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Returns `{ status: "ok" }` |

### Conversations

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/openai/conversations` | List all conversations (newest first) |
| `POST` | `/api/openai/conversations` | Create a conversation — body: `{ title: string }` |
| `GET` | `/api/openai/conversations/:id` | Get conversation with full message history |
| `DELETE` | `/api/openai/conversations/:id` | Delete conversation and all its messages (cascades) |
| `GET` | `/api/openai/conversations/:id/messages` | List messages for a conversation |
| `POST` | `/api/openai/conversations/:id/messages` | Send a message and stream the AI reply (SSE) |

#### `POST /api/openai/conversations/:id/messages` — request body

```json
{
  "content": "Hello, how are you?",
  "systemPrompt": "You are a helpful assistant.",
  "providerId": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

`providerId` and `model` are optional. When omitted (or when the provider config is missing/disabled), the server falls back to Replit AI with GPT-5.2.

#### SSE response format

The endpoint sets `Content-Type: text/event-stream` and emits newline-delimited events:

```
data: {"content":"Hello"}

data: {"content":"!"}

data: {"done":true}
```

### Images

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/openai/conversations/:id/images` | Persist an image message — body: `{ prompt: string }` |
| `POST` | `/api/openai/generate-image` | Generate an image — body: `{ prompt: string, size?: "1024x1024" | "512x512" | "256x256" }` — returns `{ b64_json: string }` |

### Provider Configuration

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/providers` | List all saved provider configs (API keys masked) |
| `PUT` | `/api/providers/:providerId` | Create or update a provider config |
| `DELETE` | `/api/providers/:providerId` | Remove a provider config |

#### `PUT /api/providers/:providerId` — request body (all fields optional)

```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.groq.com/openai/v1",
  "enabled": true,
  "selectedModel": "llama-3.3-70b-versatile"
}
```

Sending `apiKey: null` removes the stored key and automatically disables the provider. Sending the masked placeholder `"••••••••"` is a no-op — the existing key is preserved.

---

## How Streaming Works

1. The user submits a message in `ChatInput`.
2. `ChatContext.sendMessage()` creates a new conversation if needed, optimistically appends the user message to the React Query cache, then opens a `fetch` with `signal` from an `AbortController`.
3. The API server saves the user message, builds the full conversation history (system prompt + all prior turns), and calls `openai.chat.completions.create({ stream: true })` on the selected provider client.
4. Each streamed chunk is written as `data: {"content":"..."}` over SSE. The server writes `data: {"done":true}` at the end.
5. The frontend reads the `ReadableStream` with a `TextDecoder`, parses SSE lines, and accumulates chunks into `streamingContent` state — rendered live as Markdown.
6. When the stream ends (or the user clicks Stop), the server inserts the full assistant message into the database and the client invalidates the React Query cache.

---

## Provider Configuration

### How it works

The provider registry (`providers-registry.ts`) defines metadata for 45 providers: name, color, default base URL, and a list of popular models. Provider configurations (API key, custom base URL, enabled flag, selected model) are stored in the `provider_configs` PostgreSQL table.

When the frontend sends a message, it includes `{ providerId, model }` in the request body. The API server:

1. Looks up the `provider_configs` row for `providerId`.
2. Validates the stored `baseUrl` against the SSRF policy.
3. Calls `createOpenAIClient(apiKey, baseUrl)` from `@workspace/integrations-openai-ai-server` to build a per-request OpenAI-compatible client.
4. Falls back to the built-in Replit AI client (GPT-5.2) if the provider config is missing, disabled, or lacks an API key.

### Supported providers

| Provider | ID | Notes |
|---|---|---|
| Replit AI | `replit` | Built-in, no key needed |
| OpenAI | `openai` | |
| Anthropic | `anthropic` | Via OpenAI-compatible proxy |
| Gemini | `gemini` | |
| Azure OpenAI | `azure-openai` | |
| Vertex AI | `vertex-ai` | |
| Groq | `groq` | |
| OpenRouter | `openrouter` | |
| DeepSeek | `deepseek` | |
| Mistral | `mistral` | |
| Together AI | `together` | |
| Fireworks | `fireworks` | |
| Perplexity | `perplexity` | |
| xAI / Grok | `xai` | |
| Cohere | `cohere` | |
| Moonshot / 月之暗面 | `moonshot` | |
| MiniMax | `minimax` | |
| MiniMax (Global) | `minimax-global` | |
| 智谱 / ZhipuAI | `zhipu` | |
| 百度千帆 | `qianfan` | |
| 阿里云 Qwen / 通义千问 | `qwen` | |
| 零一万物 | `lingyiwanwu` | |
| 阶跃星辰 / StepFun | `stepfun` | |
| 腾讯混元 | `tencent-hunyuan` | |
| 硅基流动 / SiliconFlow | `siliconflow` | |
| Ollama | `ollama` | Local inference (dev only) |
| LM Studio | `lm-studio` | Local inference (dev only) |
| GitHub Models | `github-models` | |
| NVIDIA NIM | `nvidia` | |
| Cerebras AI | `cerebras` | |
| Hyperbolic | `hyperbolic` | |
| Voyage AI | `voyage` | Embeddings |
| Jina AI | `jina` | Embeddings |
| ModelScope 魔搭 | `modelscope` | |
| GPUStack | `gpustack` | Self-hosted |
| Vercel AI Gateway | `vercel` | |
| Cloudflare AI | `cloudflare` | |
| Hugging Face | `huggingface` | |
| AWS Bedrock | `aws-bedrock` | Coming soon |
| New API | `new-api` | Self-hosted gateway |
| 302.AI | `302-ai` | |
| DMXAPI | `dmxapi` | |
| AIHubMix | `aihubmix` | |
| BurnCloud | `burncloud` | |
| TokenFlux | `tokenflux` | |

### Adding a provider

1. Open **Settings → Providers** in the app.
2. Search for and select the provider.
3. Enter your API key and, if needed, a custom base URL.
4. Click **Save Configuration**.
5. Toggle the provider on.
6. The provider's models now appear in the model picker in the sidebar.

---

## Settings

Settings are stored in `localStorage` under the key `nexus_settings`.

| Setting | Key | Default | Description |
|---|---|---|---|
| Custom instructions | `systemPrompt` | `""` | Prepended to every system message |
| Response style | `responseStyle` | `"balanced"` | `concise`, `balanced`, or `detailed` — appended as a style directive |
| Streaming | `streamingEnabled` | `true` | When false, SSE is still used but the UX waits for completion |

The active model selection is stored separately under `nexus_active_model` as `{ providerId, model }`.

---

## SSRF Security

The `validateBaseUrl` function in `api-server/src/lib/validate-base-url.ts` is called on every provider base URL before it is used.

- **Always blocked (any environment)**:
  - `169.254.169.254` (AWS/Azure EC2 metadata)
  - `fd00:ec2::254`
  - `metadata.google.internal`
  - `instance-data`

- **Blocked in production only**:
  - Loopback: `localhost`, `127.x.x.x`, `::1`
  - Private RFC1918: `10.x`, `172.16-31.x`, `192.168.x`
  - Link-local: `169.254.x.x`
  - IPv6 private: `fc`, `fd`, `fe80` prefixes
  - Unspecified: `0.0.0.0`

- **Allowed in development**:
  - `localhost:11434` (Ollama) and `localhost:1234` (LM Studio) work in dev mode.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — auto-provisioned by Replit |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI proxy base URL — auto-provisioned |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI key — auto-provisioned |
| `PORT` | HTTP port for the API server — auto-assigned by Replit |
| `NODE_ENV` | Controls SSRF strictness — `production` blocks private IPs |

---

## Development

### Prerequisites

- Node.js 24
- pnpm 10+
- A Replit account (for AI Integrations and the managed PostgreSQL database)

### Running locally on Replit

Both workflows start automatically:

- **API Server** — `pnpm --filter @workspace/api-server run dev`
- **AI Agent (frontend)** — `pnpm --filter @workspace/ai-agent run dev`

### Running tests

```bash
pnpm --filter @workspace/api-server run test
```

This runs 15 unit tests for the SSRF URL validator using Node.js's built-in `node:test` runner via `tsx`.

### Type checking

```bash
pnpm run typecheck
```

Runs `tsc --build` across all composite TypeScript project references from the root.

### Regenerating API client code

```bash
pnpm --filter @workspace/api-spec run codegen
```

This runs Orval against the OpenAPI 3.1 spec in `lib/api-spec/` and regenerates the React Query hooks in `lib/api-client-react/` and the Zod schemas in `lib/api-zod/`.

---

## Architecture Notes

- **No direct `openai` imports in `api-server`** — always use `createOpenAIClient` from `@workspace/integrations-openai-ai-server`. This keeps Replit AI Integration proxying working correctly.
- **API keys are never returned in plaintext** — all `GET /api/providers` and `PUT /api/providers/:id` responses mask the key as `••••••••`. The raw key is never sent to the frontend.
- **Same-tab model sync** — `ModelPicker` dispatches a custom DOM event `nexus:activeModelChange` so the `Sidebar` updates immediately without a cross-tab `localStorage` event.
- **Image messages** — stored in the DB with `role: "image"` and `content: JSON.stringify({ prompt })`. The actual image data URL lives in React state (`localMedia` in `ChatContext`) and is not persisted to disk.
- **Cascade deletes** — `messages.conversation_id` has `onDelete: "cascade"`, so deleting a conversation also removes all its messages.
