import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  boolean,
  real,
  index,
  uniqueIndex,
  pgEnum,
  customType,
} from 'drizzle-orm/pg-core';

// pgvector custom type. Dim matches OLLAMA_EMBED_DIM (nomic-embed-text = 768).
const VECTOR_DIM = 768;
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${VECTOR_DIM})`;
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
});

export const clientReviewStatus = pgEnum('client_review_status', [
  'pending',
  'approved',
  'rejected',
  'merged',
]);

export const syncJobStatus = pgEnum('sync_job_status', [
  'queued',
  'running',
  'done',
  'failed',
]);

export const fileStatus = pgEnum('file_status', [
  'discovered',
  'parsing',
  'parsed',
  'extracting',
  'extracted',
  'failed',
  'skipped',
]);

// ============ Clients ============
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    domain: text('domain'),
    country: text('country'),
    industry: text('industry'),
    size: text('size'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameTrgmIdx: index('clients_name_trgm_idx').using(
      'gin',
      sql`${t.normalizedName} gin_trgm_ops`,
    ),
    domainIdx: uniqueIndex('clients_domain_uniq').on(t.domain),
  }),
);

export const clientAliases = pgTable(
  'client_aliases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    normalizedAlias: text('normalized_alias').notNull(),
    source: text('source'), // 'folder' | 'file' | 'llm' | 'web'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    aliasTrgmIdx: index('client_aliases_trgm_idx').using(
      'gin',
      sql`${t.normalizedAlias} gin_trgm_ops`,
    ),
    clientIdx: index('client_aliases_client_idx').on(t.clientId),
  }),
);

export const clientReviews = pgTable('client_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  candidateName: text('candidate_name').notNull(),
  normalizedCandidate: text('normalized_candidate').notNull(),
  signals: jsonb('signals').$type<Record<string, unknown>>().default({}).notNull(),
  matches: jsonb('matches')
    .$type<Array<{ clientId: string; score: number; name: string }>>()
    .default([])
    .notNull(),
  suggestedClientId: uuid('suggested_client_id').references(() => clients.id, {
    onDelete: 'set null',
  }),
  status: clientReviewStatus('status').default('pending').notNull(),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============ Projects / Proposals ============
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  year: integer('year'),
  folderPath: text('folder_path'),
  status: text('status'),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const proposals = pgTable('proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  costEstimate: real('cost_estimate'),
  currency: text('currency'),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const proposalVersions = pgTable('proposal_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: uuid('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  fileId: uuid('file_id'),
  diffSummary: text('diff_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============ Services / Frameworks ============
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const frameworks = pgTable('frameworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const projectServices = pgTable(
  'project_services',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    frameworkId: uuid('framework_id').references(() => frameworks.id, {
      onDelete: 'set null',
    }),
  },
  (t) => ({
    pk: uniqueIndex('project_services_pk').on(t.projectId, t.serviceId),
  }),
);

// ============ Files ============
export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    graphItemId: text('graph_item_id').notNull(),
    driveId: text('drive_id').notNull(),
    parentPath: text('parent_path'),
    name: text('name').notNull(),
    mimeType: text('mime_type'),
    size: integer('size'),
    etag: text('etag'),
    contentHash: text('content_hash'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    status: fileStatus('status').default('discovered').notNull(),
    lastError: text('last_error'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    graphUniq: uniqueIndex('files_graph_uniq').on(t.driveId, t.graphItemId),
    hashIdx: index('files_hash_idx').on(t.contentHash),
    clientIdx: index('files_client_idx').on(t.clientId),
    projectIdx: index('files_project_idx').on(t.projectId),
  }),
);

// ============ Extractions ============
export const extractions = pgTable(
  'extractions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'client' | 'project' | 'proposal' | 'service' | ...
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    model: text('model'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    fileIdx: index('extractions_file_idx').on(t.fileId),
    kindIdx: index('extractions_kind_idx').on(t.kind),
  }),
);

// ============ Chunks (vector search) ============
export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    ord: integer('ord').notNull(),
    text: text('text').notNull(),
    tokenCount: integer('token_count'),
    embedding: vector('embedding'),
    embeddingModel: text('embedding_model'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    fileIdx: index('chunks_file_idx').on(t.fileId),
    embedIdx: index('chunks_embed_idx').using(
      'ivfflat',
      sql`${t.embedding} vector_cosine_ops`,
    ),
  }),
);

// ============ Sync jobs ============
export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(), // 'delta' | 'full' | 'folder'
  driveId: text('drive_id'),
  deltaLink: text('delta_link'),
  status: syncJobStatus('status').default('queued').notNull(),
  stats: jsonb('stats').$type<Record<string, unknown>>().default({}).notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============ Auth tokens (MSAL refresh token storage, single user) ============
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: text('provider').notNull().unique(), // 'microsoft'
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scope: text('scope'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
