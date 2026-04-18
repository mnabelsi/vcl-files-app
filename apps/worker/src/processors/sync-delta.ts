import type { Job } from 'bullmq';
import { log } from '../logger.js';

// STUB: wire to @vcl/graph fetchDeltaPage with stored delta link,
// upsert files rows, and enqueue parse-file jobs for each new/changed item.
export async function processSyncDelta(job: Job) {
  log.info({ id: job.id, data: job.data }, 'sync-delta');
  return { processed: 0 };
}
