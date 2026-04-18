import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const runtime = 'nodejs';

// Accept line-delimited share URLs and enqueue a resolution + sync job per URL.
// STUB: in v1 we just enqueue 'sync-delta' with placeholder data.
export async function POST(req: Request) {
  const form = await req.formData();
  const urls = String(form.get('urls') ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
  const q = new Queue('sync-delta', { connection });
  for (const u of urls) {
    await q.add('resolve-and-sync', { shareUrl: u });
  }
  await connection.quit();

  return NextResponse.redirect(new URL('/sync', req.url));
}
