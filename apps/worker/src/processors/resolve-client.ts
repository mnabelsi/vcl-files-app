import type { Job } from 'bullmq';
import { log } from '../logger.js';

export async function processResolveClient(job: Job) {
  log.info({ id: job.id, data: job.data }, 'resolve-client');
  return { ok: true };
}
