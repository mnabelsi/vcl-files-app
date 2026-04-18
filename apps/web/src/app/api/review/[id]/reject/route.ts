import { NextResponse } from 'next/server';
import { getDb, clientReviews } from '@vcl/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await getDb()
    .update(clientReviews)
    .set({ status: 'rejected', decidedAt: new Date() })
    .where(eq(clientReviews.id, id));
  return NextResponse.redirect(new URL('/review', req.url));
}
