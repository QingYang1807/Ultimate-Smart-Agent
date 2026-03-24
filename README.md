# Nexus.ai

> A full-stack AI Agent web application powered by GPT-5.2 via Replit AI Integrations. Real-time streaming conversations, persistent chat history, image generation, and Cherry Studio-style multi-provider configuration supporting 45 AI providers.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791?logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Provider Configuration](#provider-configuration)
8. [Frontend Components](#frontend-components)
9. [How Streaming Works](#how-streaming-works)
10. [Settings](#settings)
11. [SSRF Security](#ssrf-security)
12. [Environment Variables](#environment-variables)
13. [Getting Started](#getting-started)
14. [Development](#development)
15. [Deployment](#deployment)
16. [Architecture Notes](#architecture-notes)

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
| Runtime | Node.js 24 |
| Package manager | pnpm 10 (workspaces monorepo) |
| Language | TypeScript 5.9 (composite project references) |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Routing | Wouter |
| Data fetching | TanStack Query v5 (React Query) |
| API framework | Express 5 |
| Database | PostgreSQL (Replit managed) |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod v4 + drizzle-zod |
| API codegen | Orval (OpenAPI 3.1 → React Query hooks + Zod schemas) |
| AI | OpenAI-compatible SDK via Replit AI Integrations (GPT-5.2 + gpt-image-1) |
| Build tool | esbuild (API server CJS bundle), Vite (frontend SPA) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                          │
│                                                                 │
│  Sidebar ──► ModelPicker popover                                │
│     │                                                           │
│  ChatInput ──► ChatContext.sendMessage()                        │
│     │              │                                            │
│  MessageList ◄──── │  SSE ReadableStream reader                 │
│  (live tokens)     │  (TextDecoder + SSE line parser)           │
└────────────────────┼────────────────────────────────────────────┘
                     │  POST /api/openai/conversations/:id/messages
                     │  Content-Type: application/json
                     │  { content, systemPrompt, providerId, model }
┌────────────────────▼────────────────────────────────────────────┐
│                    Express 5 API Server                         │
│                                                                 │
│  conversations.ts route                                         │
│    1. Save user message to PostgreSQL                           │
│    2. Load conversation history from PostgreSQL                 │
│    3. Resolve provider config from provider_configs table       │
│    4. Validate baseUrl (SSRF check)                             │
│    5. createOpenAIClient(apiKey, baseUrl) → per-request client  │
│    6. openai.chat.completions.create({ stream: true })          │
│    7. Stream SSE chunks → res.write(`data: {...}\n\n`)          │
│    8. Insert full assistant message to PostgreSQL               │
│    9. Write data: {"done":true}                                 │
└─────────────────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │  PostgreSQL DB      │
          │  conversations      │
          │  messages           │
          │  provider_configs   │
          └─────────────────────┘
```

The frontend and API server are separate artifacts in a pnpm monorepo. Shared code lives in the `lib/` packages: the OpenAPI spec drives Orval codegen which produces typed React Query hooks and Zod schemas so the frontend never writes raw `fetch` calls or manual types.

---

## Project Structure

```
nexus-ai/
├── artifacts/
│   ├── ai-agent/                   # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ChatInput.tsx         # Message input + image trigger button
│   │       │   ├── ChatMessage.tsx       # Individual message bubble (Markdown + images)
│   │       │   ├── ImageGenerator.tsx    # Image generation dialog (Framer Motion)
│   │       │   ├── MarkdownRenderer.tsx  # Syntax-highlighted Markdown via react-markdown
│   │       │   ├── MessageList.tsx       # Scrollable message thread with streaming bubble
│   │       │   ├── ModelPicker.tsx       # Inline model switcher popover
│   │       │   ├── ProvidersTab.tsx      # Cherry Studio-style provider config UI
│   │       │   ├── SettingsDialog.tsx    # Settings modal (General + Providers tabs)
│   │       │   └── Sidebar.tsx           # Conversation list + model picker
│   │       ├── context/
│   │       │   └── ChatContext.tsx       # SSE streaming state + send/stop/image logic
│   │       ├── lib/
│   │       │   └── providers-registry.ts # 45-provider registry + localStorage helpers
│   │       └── pages/
│   │           ├── HomePage.tsx          # Landing / new chat with prompt suggestions
│   │           ├── ChatPage.tsx          # Active conversation view
│   │           └── not-found.tsx         # 404 page
│   └── api-server/                 # Express 5 API server
│       └── src/
│           ├── routes/
│           │   ├── health.ts             # GET /api/healthz
│           │   ├── index.ts              # Route aggregator
│           │   ├── providers.ts          # Provider config CRUD
│           │   └── openai/
│           │       ├── conversations.ts  # Conversation CRUD + SSE streaming
│           │       └── image.ts          # Image generation endpoint
│           └── lib/
│               ├── validate-base-url.ts       # SSRF validation
│               └── validate-base-url.test.ts  # 15 unit tests (node:test)
├── lib/
│   ├── api-spec/                   # OpenAPI 3.1 spec + Orval config
│   ├── api-client-react/           # Generated React Query hooks (do not edit)
│   ├── api-zod/                    # Generated Zod request/response schemas (do not edit)
│   ├── db/                         # Drizzle ORM schema + DB connection
│   │   └── src/schema/
│   │       ├── conversations.ts
│   │       ├── messages.ts
│   │       └── provider-configs.ts
│   ├── integrations-openai-ai-server/   # Server-side OpenAI SDK wrapper + createOpenAIClient
│   └── integrations-openai-ai-react/    # React hooks for OpenAI audio streaming
├── pnpm-workspace.yaml
├── tsconfig.base.json              # Shared TS config (composite: true)
└── tsconfig.json                   # Root project references
```

---

## Database Schema

### `conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | Auto-increment |
| `title` | `text NOT NULL` | First 40 chars of the opening message |
| `created_at` | `timestamptz NOT NULL` | Auto-set on insert |

### `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `conversation_id` | `integer NOT NULL` FK | References `conversations.id` — cascades on delete |
| `role` | `text NOT NULL` | `user`, `assistant`, or `image` |
| `content` | `text NOT NULL` | Plain text for user/assistant; `{"prompt":"..."}` JSON for image messages |
| `created_at` | `timestamptz NOT NULL` | |

### `provider_configs`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `provider_id` | `text UNIQUE NOT NULL` | e.g. `openai`, `groq`, `ollama` |
| `api_key` | `text` nullable | Stored server-side; masked as `••••••••` in all API responses |
| `base_url` | `text` nullable | Custom endpoint, SSRF-validated on every write |
| `enabled` | `boolean NOT NULL` default `false` | Only enabled providers appear in the model picker |
| `selected_model` | `text` nullable | Last model chosen for this provider |
| `created_at` | `timestamptz NOT NULL` | |
| `updated_at` | `timestamptz NOT NULL` | Updated on every PUT |

---

## API Reference

All routes are mounted under `/api`.

### Health

| Method | Path | Request Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/healthz` | — | `{ status: "ok" }` | Liveness check |

### Conversations

| Method | Path | Request Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/openai/conversations` | — | `Conversation[]` | List all conversations, newest first |
| `POST` | `/api/openai/conversations` | `{ title: string }` | `Conversation` (201) | Create a new conversation |
| `GET` | `/api/openai/conversations/:id` | — | `Conversation & { messages: Message[] }` | Get conversation with full message history |
| `DELETE` | `/api/openai/conversations/:id` | — | 204 No Content | Delete conversation and all messages (cascade) |
| `GET` | `/api/openai/conversations/:id/messages` | — | `Message[]` | List messages for a conversation |
| `POST` | `/api/openai/conversations/:id/messages` | See below | `text/event-stream` SSE | Send message and stream AI reply |
| `POST` | `/api/openai/conversations/:id/images` | `{ prompt: string }` | `Message` (201) | Persist an image message record |
| `POST` | `/api/openai/generate-image` | `{ prompt: string, size?: "1024x1024" \| "512x512" \| "256x256" }` | `{ b64_json: string }` | Generate image with gpt-image-1 |

#### `POST /api/openai/conversations/:id/messages` — request body

```json
{
  "content": "Hello, how are you?",
  "systemPrompt": "You are a helpful assistant.",
  "providerId": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

`providerId` and `model` are optional. When omitted (or when the provider config is missing, disabled, or lacks an API key), the server falls back to Replit AI with GPT-5.2.

#### SSE response format

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content":"Hello"}

data: {"content":", world"}

data: {"done":true}
```

Each `data:` line contains a JSON object with either `content` (a text delta) or `done: true` (stream end sentinel).

### Provider Configuration

| Method | Path | Request Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/providers` | — | `ProviderConfig[]` | List all saved configs (API keys masked) |
| `PUT` | `/api/providers/:providerId` | See below | `ProviderConfig` (200 or 201) | Create or update a provider config |
| `DELETE` | `/api/providers/:providerId` | — | 204 No Content | Remove a provider config |

#### `PUT /api/providers/:providerId` — request body (all fields optional)

```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.groq.com/openai/v1",
  "enabled": true,
  "selectedModel": "llama-3.3-70b-versatile"
}
```

- Sending `apiKey: null` removes the stored key and automatically disables the provider.
- Sending the masked placeholder `"••••••••"` is a no-op — the existing key is preserved.
- `baseUrl` is SSRF-validated on every write; invalid URLs return `400`.

---

## Provider Configuration

### How it works

The provider registry (`providers-registry.ts`) defines metadata for 45 providers: name, brand color, default base URL, and a curated list of popular models. Provider configurations (API key, custom base URL, enabled state, selected model) are stored in the `provider_configs` PostgreSQL table — never in the browser.

When the frontend sends a message, it includes `{ providerId, model }` in the request body. The API server:

1. Looks up the `provider_configs` row for `providerId`.
2. Validates the stored `baseUrl` against the SSRF policy.
3. Calls `createOpenAIClient(apiKey, baseUrl)` from `@workspace/integrations-openai-ai-server` to build a per-request OpenAI-compatible client pointing at the provider's endpoint.
4. Falls back to the built-in Replit AI client (GPT-5.2) if the provider config is missing, disabled, or lacks an API key.

### Adding a provider

1. Open **Settings → Providers** in the app.
2. Search for and select the provider.
3. Enter your API key and, if needed, a custom base URL.
4. Click **Save Configuration**.
5. Toggle the provider on.
6. The provider's models now appear in the model picker popover in the sidebar.

### Supported providers

| Provider | ID | Default Base URL | Compatible |
|---|---|---|---|
| Replit AI | `replit` | Built-in | Yes |
| OpenAI | `openai` | `https://api.openai.com/v1` | Yes |
| Anthropic | `anthropic` | `https://api.anthropic.com/v1` | Yes (via proxy) |
| Gemini | `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | Yes |
| Azure OpenAI | `azure-openai` | `https://{resource}.openai.azure.com/openai/deployments/{deployment}` | Yes |
| Vertex AI | `vertex-ai` | `https://us-central1-aiplatform.googleapis.com/v1/...` | Yes |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Yes |
| OpenRouter | `openrouter` | `https://openrouter.ai/api/v1` | Yes |
| DeepSeek | `deepseek` | `https://api.deepseek.com/v1` | Yes |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Yes |
| Together AI | `together` | `https://api.together.xyz/v1` | Yes |
| Fireworks | `fireworks` | `https://api.fireworks.ai/inference/v1` | Yes |
| Perplexity | `perplexity` | `https://api.perplexity.ai` | Yes |
| xAI / Grok | `xai` | `https://api.x.ai/v1` | Yes |
| Cohere | `cohere` | `https://api.cohere.ai/compatibility/v1` | Yes |
| Moonshot / 月之暗面 | `moonshot` | `https://api.moonshot.cn/v1` | Yes |
| MiniMax | `minimax` | `https://api.minimax.chat/v1` | Yes |
| MiniMax (Global) | `minimax-global` | `https://api.minimaxi.chat/v1` | Yes |
| 智谱 / ZhipuAI | `zhipu` | `https://open.bigmodel.cn/api/paas/v4` | Yes |
| 百度千帆 | `qianfan` | `https://qianfan.baidubce.com/v2` | Yes |
| 阿里云 Qwen / 通义千问 | `qwen` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Yes |
| 零一万物 | `lingyiwanwu` | `https://api.lingyiwanwu.com/v1` | Yes |
| 阶跃星辰 / StepFun | `stepfun` | `https://api.stepfun.com/v1` | Yes |
| 腾讯混元 | `tencent-hunyuan` | `https://api.hunyuan.cloud.tencent.com/v1` | Yes |
| 硅基流动 / SiliconFlow | `siliconflow` | `https://api.siliconflow.cn/v1` | Yes |
| Ollama | `ollama` | `http://localhost:11434/v1` | Yes (dev only) |
| LM Studio | `lm-studio` | `http://localhost:1234/v1` | Yes (dev only) |
| GitHub Models | `github-models` | `https://models.inference.ai.azure.com` | Yes |
| NVIDIA NIM | `nvidia` | `https://integrate.api.nvidia.com/v1` | Yes |
| Cerebras AI | `cerebras` | `https://api.cerebras.ai/v1` | Yes |
| Hyperbolic | `hyperbolic` | `https://api.hyperbolic.xyz/v1` | Yes |
| Voyage AI | `voyage` | `https://api.voyageai.com/v1` | Yes |
| Jina AI | `jina` | `https://api.jina.ai/v1` | Yes |
| ModelScope 魔搭 | `modelscope` | `https://api-inference.modelscope.cn/v1` | Yes |
| GPUStack | `gpustack` | `http://your-gpustack-server/v1-openai` | Yes |
| Vercel AI Gateway | `vercel` | `https://ai-gateway.vercel.sh` | Yes |
| Cloudflare AI | `cloudflare` | `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1` | Yes |
| Hugging Face | `huggingface` | `https://api-inference.huggingface.co/models` | Yes |
| AWS Bedrock | `aws-bedrock` | `https://bedrock-runtime.{region}.amazonaws.com` | No (coming soon) |
| New API | `new-api` | `https://your-new-api-host/v1` | Yes |
| 302.AI | `302-ai` | `https://api.302.ai/v1` | Yes |
| DMXAPI | `dmxapi` | `https://www.dmxapi.cn/v1` | Yes |
| AIHubMix | `aihubmix` | `https://aihubmix.com/v1` | Yes |
| BurnCloud | `burncloud` | `https://burn.hair/v1` | Yes |
| TokenFlux | `tokenflux` | `https://tokenflux.ai/v1` | Yes |

---

## Frontend Components

### Pages

| Page | Path | Description |
|---|---|---|
| `HomePage` | `/` | Landing page with prompt suggestions, chat input, and image generator trigger. Creates a new conversation on first message send. |
| `ChatPage` | `/c/:id` | Active conversation view. Loads conversation history, renders streaming tokens live, provides image generation in context. |
| `not-found` | `*` | 404 page. |

### Components

| Component | Description |
|---|---|
| `Sidebar` | Left navigation panel. Lists recent conversations with timestamps, delete buttons, the model picker, and a Settings button. Listens to the `nexus:activeModelChange` custom event and `localStorage` `storage` event to stay in sync with the active model. |
| `ModelPicker` | Compact inline popover (above the Settings button) that lists Replit AI models and all enabled custom provider models. Dispatches `nexus:activeModelChange` on selection to sync all tabs and the same-tab sidebar without a page reload. |
| `ChatInput` | Textarea with auto-resize, Enter-to-send (Shift+Enter for newline), Stop button during streaming, and an image generation trigger button. |
| `MessageList` | Scrollable thread that renders all persisted messages plus a live streaming bubble. Auto-scrolls to the bottom on new content. |
| `ChatMessage` | Single message bubble. Renders `user` messages as plain text, `assistant` messages as syntax-highlighted Markdown, and `image` messages as a generated image with prompt caption. |
| `MarkdownRenderer` | Wraps `react-markdown` with `remark-gfm`, syntax highlighting via `react-syntax-highlighter`, and copy-to-clipboard for code blocks. |
| `ImageGenerator` | Animated modal (Framer Motion) with a textarea for the image prompt. Calls `POST /api/openai/generate-image`, converts the returned `b64_json` to a data URL, and passes it to the parent. |
| `SettingsDialog` | Two-tab modal: **General** (model info, response style, streaming toggle, custom instructions, clear-all data) and **Providers** (renders `ProvidersTab`). |
| `ProvidersTab` | Cherry Studio-style two-pane layout. Left: scrollable provider list with search, toggle switches, and enabled count. Right: detail panel for the selected provider — API key input (masked), base URL, save/remove buttons, and model selector. |

### Context

| Context | Description |
|---|---|
| `ChatContext` | Manages SSE streaming state (`isStreaming`, `streamingContent`), `localMedia` (in-session image data URLs keyed by conversation ID), and the core `sendMessage`, `stopStreaming`, `addLocalMedia`, `addAndPersistImage`, and `createConversationWithImage` functions. |

---

## How Streaming Works

1. The user submits a message in `ChatInput`.
2. `ChatContext.sendMessage()` creates a new conversation if needed, optimistically appends the user message to the React Query cache, then opens a `fetch` request with a signal from an `AbortController`.
3. The API server saves the user message to the DB, builds the full conversation history (system prompt + all prior `user`/`assistant` turns), and calls `openai.chat.completions.create({ stream: true })` on the resolved provider client.
4. Each streamed delta is written as `data: {"content":"..."}` to the SSE response.
5. The frontend reads the `ReadableStream` via `reader.read()`, decodes with `TextDecoder`, and parses SSE lines in a sliding buffer — accumulating chunks into `streamingContent` React state which is rendered live as Markdown.
6. When the stream ends (or the user clicks Stop and the `AbortController` fires), the server inserts the full assembled assistant message into PostgreSQL, writes `data: {"done":true}`, and closes the connection. The client then invalidates the React Query cache to fetch the persisted message.

---

## Settings

Client-side settings are stored in `localStorage`.

### `nexus_settings` (key)

| Setting | Field | Default | Description |
|---|---|---|---|
| Custom instructions | `systemPrompt` | `""` | Prepended to every system message. If empty, a default capable-assistant prompt is used. |
| Response style | `responseStyle` | `"balanced"` | `"concise"`, `"balanced"`, or `"detailed"` — appended as a style directive to the system prompt. |
| Streaming toggle | `streamingEnabled` | `true` | Persisted for UX — SSE is always used server-side. |

### `nexus_active_model` (key)

Stores the currently selected provider and model as `{ providerId: string, model: string }`. Defaults to `{ providerId: "replit", model: "gpt-5.2" }`.

---

## SSRF Security

The `validateBaseUrl` function in `artifacts/api-server/src/lib/validate-base-url.ts` is applied to every provider `baseUrl` before it is stored (`PUT /api/providers/:id`) and before it is used to create a client (message send).

**Always blocked (any environment):**
- `169.254.169.254` — AWS/Azure IMDSv1
- `fd00:ec2::254` — AWS IMDSv2 IPv6
- `metadata.google.internal` — GCP metadata
- `instance-data` — legacy cloud metadata

**Blocked in production only (`NODE_ENV=production`):**
- Loopback: `localhost`, `127.x.x.x`, `::1`
- Private RFC1918: `10.x`, `172.16–31.x`, `192.168.x`
- Link-local: `169.254.x.x`, `fe80::`
- IPv6 ULA: `fc`, `fd` prefixes
- Unspecified: `0.0.0.0`

**Allowed in development:**
- `localhost:11434` (Ollama) and `localhost:1234` (LM Studio) work in `NODE_ENV=development`.

The validator is covered by 15 unit tests in `validate-base-url.test.ts`, run via `node:test` and `tsx`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — auto-provisioned by Replit |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI proxy base URL — auto-provisioned |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI key — auto-provisioned |
| `PORT` | HTTP port for the API server — auto-assigned by Replit |
| `NODE_ENV` | Controls SSRF strictness (`production` blocks all private IPs) |

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- A Replit account (for AI Integrations and the managed PostgreSQL database)

### Clone and install

```bash
# Clone the repository
git clone <your-repo-url> nexus-ai
cd nexus-ai

# Install all workspace dependencies
pnpm install
```

### Set up the database

```bash
# Push the Drizzle schema to the connected PostgreSQL database
pnpm --filter @workspace/db run push
```

This runs `drizzle-kit push` which creates the `conversations`, `messages`, and `provider_configs` tables.

### Start the development servers

```bash
# Start the API server (Express 5)
pnpm --filter @workspace/api-server run dev

# In a second terminal: start the frontend (React + Vite)
pnpm --filter @workspace/ai-agent run dev
```

On Replit both workflows start automatically when you open the Repl.

---

## Development

### Running tests

```bash
pnpm --filter @workspace/api-server run test
```

Runs 15 unit tests for the SSRF URL validator using Node.js's built-in `node:test` runner via `tsx`.

### Type checking

```bash
pnpm run typecheck
```

Runs `tsc --build` across all composite TypeScript project references from the root. Every package extends `tsconfig.base.json` which enforces `composite: true` and `emitDeclarationOnly`.

### Regenerating API client code

```bash
pnpm --filter @workspace/api-spec run codegen
```

Runs Orval against the OpenAPI 3.1 spec in `lib/api-spec/` and regenerates:
- `lib/api-client-react/` — typed React Query hooks for every endpoint
- `lib/api-zod/` — Zod request/response schemas

Do not hand-edit files in these packages; they are overwritten on every codegen run.

---

## Deployment

Nexus.ai is designed to be deployed on Replit. The managed PostgreSQL database and AI Integrations are automatically provisioned — no additional infrastructure configuration is needed.

To publish:
1. Verify the app works correctly in the preview pane.
2. Click **Deploy** in the Replit workspace (or use the Replit CLI).
3. Replit builds the frontend with `vite build`, bundles the API server with `esbuild`, runs database migrations, and exposes the app under a `.replit.app` domain with TLS.

In the deployed environment, `NODE_ENV` is set to `production`, which:
- Activates the full SSRF block list (no private/loopback IPs allowed).
- Disables development-only request logging verbosity.

---

## Architecture Notes

- **No direct `openai` imports in `api-server`** — always use `createOpenAIClient` from `@workspace/integrations-openai-ai-server`. This keeps the Replit AI Integration proxy working correctly and avoids hardcoding the base URL.
- **API keys are never returned in plaintext** — all `GET /api/providers` and `PUT /api/providers/:id` responses mask the key as `••••••••`. The raw key is only ever read from the DB to build the per-request client.
- **Same-tab model sync** — `ModelPicker` dispatches the custom DOM event `nexus:activeModelChange` so the `Sidebar` updates immediately without needing a cross-tab `localStorage` event. The `Sidebar` also listens to the `storage` event for cross-tab sync.
- **Image messages** — stored in the DB with `role: "image"` and `content: JSON.stringify({ prompt })`. The actual image data URL lives in React state (`localMedia` in `ChatContext`, keyed by conversation ID) and is not written to disk or the database.
- **Cascade deletes** — `messages.conversation_id` has `onDelete: "cascade"`, so deleting a conversation also removes all its messages atomically.
- **Optimistic UI** — `ChatContext.sendMessage()` appends the user's message to the React Query cache before the server responds, so the UI never feels laggy.
- **OpenAPI-driven codegen** — adding a new endpoint means updating the spec in `lib/api-spec/` and running `pnpm --filter @workspace/api-spec run codegen`. The typed hook and Zod schema are generated automatically.
