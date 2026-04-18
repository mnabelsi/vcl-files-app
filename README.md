# vcl-files-app

Personal OneDrive -> knowledge base for proposals, clients, services, frameworks.

Monorepo: Next.js 15 web, Node/BullMQ worker, Postgres+pgvector, Redis, Ollama (local) + Claude (Anthropic) tiered LLM routing.

## Layout

```
apps/
  web/              Next.js 15 App Router (UI + API)
  worker/           BullMQ ingestion + processing
packages/
  db/               Drizzle schema + migrations
  llm/              Ollama + Anthropic providers + router (prompt caching)
  graph/            Microsoft Graph (OneDrive) + MSAL personal-account OAuth
  extract/          docx/pdf/pptx/xlsx parsers (tesseract OCR fallback)
  enrichment/       Tavily + pg_trgm client resolution
  pipeline/         chunk -> embed -> extract -> resolve -> upsert
```

## Prerequisites

- Node 22, pnpm 9, Docker + compose
- On the VPS: Ollama running with these models pulled
  ```bash
  docker exec ollama-api-xs0cc04ksc400c8g804cswow ollama pull nomic-embed-text
  docker exec ollama-api-xs0cc04ksc400c8g804cswow ollama pull qwen2.5:3b
  ```

## Local dev

```bash
cp .env.example .env
# Generate a password hash for login:
node -e "import('bcryptjs').then(b=>console.log(b.default.hashSync('yourpw',10)))"
# paste that into APP_USER_PASSWORD_HASH in .env

pnpm install
docker compose up --build
```

- Web: http://localhost:3000 (login with APP_USER_EMAIL / your password)
- Postgres: localhost:5432
- Migrations run automatically when the worker container starts.

For Next dev with hot reload (outside docker):

```bash
pnpm --filter @vcl/web dev
pnpm --filter @vcl/worker dev
```

## IMPORTANT: Next.js 15 post-install check

Before adding more route handlers, skim the bundled docs to confirm current async-API signatures (Next 15 made `params`, `searchParams`, `cookies()`, `headers()` async):

```bash
ls node_modules/next/dist/docs
```

If anything in `apps/web/src/app/**` trips a type error about `params` not being a Promise or similar, that's where to look.

## Coolify deploy

Four services from this private repo, all attached to **the same network as the existing `ollama-api-...` container**:

| Service | Build context | Dockerfile | Port |
|---|---|---|---|
| postgres | (image only) | `pgvector/pgvector:pg16` | 5432 |
| redis | (image only) | `redis:7-alpine` | 6379 |
| web | repo root | `apps/web/Dockerfile` | 3000 |
| worker | repo root | `apps/worker/Dockerfile` | — |

All env vars go in the Coolify UI (not committed). Point `OLLAMA_URL` at the Ollama container's service hostname on that network:

```
OLLAMA_URL=http://ollama-api-xs0cc04ksc400c8g804cswow:11434
```

Remove `extra_hosts` from docker-compose or leave it — Coolify ignores it and uses its own network wiring.

Migrations run on worker container start (`pnpm --filter @vcl/db migrate`).

## Env vars

See `.env.example`. Required in prod:

- `DATABASE_URL`, `REDIS_URL`
- `OLLAMA_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, `OLLAMA_EMBED_DIM`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_HAIKU_MODEL`, `ANTHROPIC_SONNET_MODEL`, `ANTHROPIC_OPUS_MODEL`
- `MS_CLIENT_ID`, `MS_TENANT_ID=consumers`, `MS_REDIRECT_URI`
- `TAVILY_API_KEY`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_USER_EMAIL`, `APP_USER_PASSWORD_HASH`

## What's real vs stubbed (v1)

**Real:** Drizzle schema (incl. pgvector + pg_trgm, client-resolution tables), migration runner, docker-compose, LLM router with working Ollama + Anthropic calls and prompt caching on system+schema blocks, NextAuth credentials login, all UI page shells, BullMQ worker skeleton with 5 queues, parser functions (docx/pdf/pptx/xlsx), chunker, MSAL auth URL + code exchange, Graph share URL resolver + delta fetch, Tavily client, pg_trgm client resolver with 0.85/0.6 thresholds.

**Stubbed:** sync-delta processor body (enqueues but doesn't upsert yet), parse-file processor body, full pipeline glue (OneDrive download -> parse -> upsert chunks), OCR rasterization, LLM-based client extraction prompt, review merge/approve actually applying to clients table, query page vector retrieval (currently pipes straight to Sonnet).

## Model tiering

- **bulk** (Ollama `qwen2.5:3b`): per-chunk extraction, classification, dedup, version-diffing, embeddings
- **structured** (Claude Haiku 4.5): client entity extraction where JSON reliability matters
- **synthesis** (Claude Sonnet 4.6): user-facing query answers
- **premium** (Claude Opus 4.7): cross-document synthesis

Router lives in `packages/llm/src/router.ts`. Prompt caching (`cache_control: ephemeral`) is applied to the last system block for all Anthropic calls — pass `cacheSystem: true` in chat options.

## Client entity resolution

For each top-level folder:
1. Normalize name (`packages/db/src/normalize.ts` strips years, "final", "v2", punctuation).
2. Run pg_trgm similarity against `clients.normalized_name` + `client_aliases.normalized_alias`.
3. Score >= 0.85 -> auto-merge as alias. 0.6–0.85 -> row in `client_reviews` for manual decision. < 0.6 -> new client (after LLM extract + Tavily enrichment).

Review UI at `/review`.

## Scale notes

- 8GB RAM VPS with Ollama = keep worker concurrency 2 (set `WORKER_CONCURRENCY`).
- Target 50k-file initial ingest: expect multi-day run. Delta sync incremental after.
- Never reprocess unchanged files: `files.content_hash` + Graph `eTag` skip logic.
