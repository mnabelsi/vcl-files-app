import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export * from './schema.js';
export * from './normalize.js';
export { schema };

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export function getDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not set');
  if (_db) return _db;
  _client = postgres(url, { max: 10, prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function closeDb() {
  if (_client) await _client.end();
  _client = null;
  _db = null;
}
