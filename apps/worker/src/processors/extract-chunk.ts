import type { Job } from 'bullmq';
import { log } from '../logger.js';

export async function processExtractChunk(job: Job) {
  log.info({ id: job.id, data: job.data }, 'extract-chunk');
  return { ok: true };
}
