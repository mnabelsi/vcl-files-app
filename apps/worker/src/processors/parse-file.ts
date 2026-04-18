import type { Job } from 'bullmq';
import { log } from '../logger.js';

// STUB: load file row, download buffer via @vcl/graph, call processFile.
export async function processParseFile(job: Job) {
  log.info({ id: job.id, data: job.data }, 'parse-file');
  return { ok: true };
}
