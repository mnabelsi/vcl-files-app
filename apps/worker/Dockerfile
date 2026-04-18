# Multi-stage Dockerfile for the BullMQ worker.
# Build context is the monorepo root.
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/llm/package.json packages/llm/
COPY packages/graph/package.json packages/graph/
COPY packages/extract/package.json packages/extract/
COPY packages/enrichment/package.json packages/enrichment/
COPY packages/pipeline/package.json packages/pipeline/
RUN pnpm install --frozen-lockfile=false

FROM base AS runner
WORKDIR /app
COPY --from=deps /app /app
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

ENV NODE_ENV=production
# Run migrations then start the worker.
CMD ["sh", "-c", "pnpm --filter @vcl/db migrate && pnpm --filter @vcl/worker start"]
