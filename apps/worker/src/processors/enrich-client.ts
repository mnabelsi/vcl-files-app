import type { Job } from 'bullmq';
import { log } from '../logger.js';

export async function processEnrichClient(job: Job) {
  log.info({ id: job.id, data: job.data }, 'enrich-client');
  return { ok: true };
}
