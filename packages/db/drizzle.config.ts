import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://vcl:vcl@localhost:5432/vcl',
  },
  verbose: true,
  strict: true,
} satisfies Config;
