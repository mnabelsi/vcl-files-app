import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Separate client with a single connection for migrations.
  const migrationClient = postgres(url, { max: 1, prepare: false });

  // Enable required extensions before running migrations.
  await migrationClient.unsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await migrationClient.unsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  const db = drizzle(migrationClient);
  const here = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = resolve(here, '../drizzle');

  console.log(`[db] running migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log('[db] migrations complete');

  await migrationClient.end();
}

main().catch((err) => {
  console.error('[db] migration failed', err);
  process.exit(1);
});
