import { NextResponse } from 'next/server';
import { getDb, clientReviews } from '@vcl/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await getDb()
    .update(clientReviews)
    .set({ status: 'approved', decidedAt: new Date() })
    .where(eq(clientReviews.id, id));
  // STUB: create clients row from review signals.
  return NextResponse.redirect(new URL('/review', req.url));
}
