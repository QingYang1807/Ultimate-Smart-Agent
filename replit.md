# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A full-stack AI Agent web application powered by GPT-5.2.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (no user API key needed)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── ai-agent/           # React + Vite frontend (AI Agent UI)
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/   # OpenAI server-side SDK wrapper
│   └── integrations-openai-ai-react/    # OpenAI React hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## AI Agent Features

- **Streaming chat**: SSE-based streaming responses from GPT-5.2
- **Persistent conversations**: Conversations and messages stored in PostgreSQL
- **Multi-turn context**: Full conversation history sent to GPT-5.2 on each request
- **Image generation**: gpt-image-1 via POST /api/openai/generate-image
- **Dark mode UI**: Professional dark-mode interface with sidebar + chat layout

## Database Schema

- `conversations` table: id, title, created_at
- `messages` table: id, conversation_id (FK), role, content, created_at

## API Routes

All routes under `/api`:

- `GET /api/healthz` — Health check
- `GET /api/openai/conversations` — List all conversations
- `POST /api/openai/conversations` — Create new conversation
- `GET /api/openai/conversations/:id` — Get conversation with messages
- `DELETE /api/openai/conversations/:id` — Delete conversation
- `GET /api/openai/conversations/:id/messages` — List messages
- `POST /api/openai/conversations/:id/messages` — Send message (SSE streaming)
- `POST /api/openai/generate-image` — Generate image (base64 response)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files emitted during typecheck
- **Project references** — each lib must be listed in `references`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI key (auto-provisioned)
- `PORT` — Server port (auto-assigned)

## Packages

### `artifacts/ai-agent` (`@workspace/ai-agent`)

React + Vite frontend with dark-mode professional UI. Chat interface with sidebar.

- Pages: `src/pages/HomePage.tsx` (landing), `src/pages/ChatPage.tsx` (chat)
- Components: Sidebar, MessageList, ChatInput, MarkdownRenderer, ImageGenerator
- Hooks: `src/hooks/use-chat.ts` (SSE streaming, conversation management)
- Depends on: `@workspace/api-client-react`, `@workspace/integrations-openai-ai-react`

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`.

- `src/routes/openai/conversations.ts` — Conversation CRUD + SSE streaming
- `src/routes/openai/image.ts` — Image generation
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-openai-ai-server`

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

Server-side OpenAI SDK wrapper. Exports: client, audio, image, batch utilities.

### `lib/integrations-openai-ai-react` (`@workspace/integrations-openai-ai-react`)

React hooks for OpenAI audio streaming.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/conversations.ts` — conversations table
- `src/schema/messages.ts` — messages table (FK to conversations)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen. Run: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks from OpenAPI spec.
