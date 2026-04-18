import { NextResponse } from 'next/server';
import { buildMsalClient, exchangeCode } from '@vcl/graph';
import { getDb, authTokens } from '@vcl/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });

  const env = {
    clientId: process.env.MS_CLIENT_ID ?? '',
    tenantId: process.env.MS_TENANT_ID ?? 'consumers',
    redirectUri: process.env.MS_REDIRECT_URI ?? 'http://localhost:3000/api/ms/callback',
  };
  const pca = buildMsalClient(env);
  const result = await exchangeCode(pca, env, code);

  // Persist tokens (single row, provider = 'microsoft').
  const db = getDb();
  await db
    .insert(authTokens)
    .values({
      provider: 'microsoft',
      accessToken: result.accessToken,
      refreshToken:
        (result as { refreshToken?: string }).refreshToken ?? null,
      expiresAt: result.expiresOn ?? null,
      scope: result.scopes?.join(' ') ?? null,
    })
    .onConflictDoUpdate({
      target: authTokens.provider,
      set: {
        accessToken: result.accessToken,
        refreshToken: (result as { refreshToken?: string }).refreshToken ?? null,
        expiresAt: result.expiresOn ?? null,
        scope: result.scopes?.join(' ') ?? null,
        updatedAt: sql`now()`,
      },
    });

  return NextResponse.redirect(new URL('/setup', req.url));
}
