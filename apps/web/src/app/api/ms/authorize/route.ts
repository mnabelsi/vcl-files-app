import { NextResponse } from 'next/server';
import { buildMsalClient, getAuthUrl } from '@vcl/graph';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function GET() {
  const env = {
    clientId: process.env.MS_CLIENT_ID ?? '',
    tenantId: process.env.MS_TENANT_ID ?? 'consumers',
    redirectUri: process.env.MS_REDIRECT_URI ?? 'http://localhost:3000/api/ms/callback',
  };
  if (!env.clientId) {
    return NextResponse.json({ error: 'MS_CLIENT_ID not set' }, { status: 400 });
  }
  const pca = buildMsalClient(env);
  const url = await getAuthUrl(pca, env, randomUUID());
  return NextResponse.redirect(url);
}
