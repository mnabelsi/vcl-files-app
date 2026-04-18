import { NextResponse } from 'next/server';
import { getDb, clientReviews } from '@vcl/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const form = await req.formData();
  const clientId = String(form.get('clientId') ?? '');
  await getDb()
    .update(clientReviews)
    .set({ status: 'merged', suggestedClientId: clientId, decidedAt: new Date() })
    .where(eq(clientReviews.id, id));
  // STUB: actually apply alias + relink files to chosen client here.
  return NextResponse.redirect(new URL('/review', req.url));
}
