import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  syncDelta: 'sync-delta',
  parseFile: 'parse-file',
  extractChunk: 'extract-chunk',
  resolveClient: 'resolve-client',
  enrichClient: 'enrich-client',
} as const;

export const queues = {
  syncDelta: new Queue(QUEUE_NAMES.syncDelta, { connection }),
  parseFile: new Queue(QUEUE_NAMES.parseFile, { connection }),
  extractChunk: new Queue(QUEUE_NAMES.extractChunk, { connection }),
  resolveClient: new Queue(QUEUE_NAMES.resolveClient, { connection }),
  enrichClient: new Queue(QUEUE_NAMES.enrichClient, { connection }),
};

export type JobPayloads = {
  'sync-delta': { driveId: string; rootItemId?: string };
  'parse-file': { fileId: string };
  'extract-chunk': { fileId: string };
  'resolve-client': { reviewId?: string; candidateName: string; folderPath: string };
  'enrich-client': { clientId: string };
};
