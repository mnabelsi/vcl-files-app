import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from './queues.js';
import { log } from './logger.js';
import { processSyncDelta } from './processors/sync-delta.js';
import { processParseFile } from './processors/parse-file.js';
import { processExtractChunk } from './processors/extract-chunk.js';
import { processResolveClient } from './processors/resolve-client.js';
import { processEnrichClient } from './processors/enrich-client.js';

// Keep concurrency low — Ollama shares 8GB RAM on the VPS.
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 2);

const workers = [
  new Worker(QUEUE_NAMES.syncDelta, processSyncDelta, { connection, concurrency: 1 }),
  new Worker(QUEUE_NAMES.parseFile, processParseFile, {
    connection,
    concurrency: CONCURRENCY,
  }),
  new Worker(QUEUE_NAMES.extractChunk, processExtractChunk, {
    connection,
    concurrency: CONCURRENCY,
  }),
  new Worker(QUEUE_NAMES.resolveClient, processResolveClient, {
    connection,
    concurrency: 1,
  }),
  new Worker(QUEUE_NAMES.enrichClient, processEnrichClient, {
    connection,
    concurrency: 1,
  }),
];

for (const w of workers) {
  w.on('completed', (job) => log.info({ queue: w.name, id: job.id }, 'completed'));
  w.on('failed', (job, err) =>
    log.error({ queue: w.name, id: job?.id, err: err.message }, 'failed'),
  );
}

log.info({ queues: workers.map((w) => w.name), concurrency: CONCURRENCY }, 'worker up');

async function shutdown() {
  log.info('shutting down workers');
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
