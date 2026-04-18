import { NextResponse } from 'next/server';
import { routerFromEnv } from '@vcl/llm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { q } = (await req.json()) as { q: string };
  if (!q?.trim()) return NextResponse.json({ answer: '' });

  // STUB: in v1 we just echo through Sonnet. Real impl: embed query, top-k
  // chunks via pgvector, assemble context, call synthesis tier with caching.
  try {
    const router = routerFromEnv();
    const provider = router.providerFor('user-query');
    const resp = await provider.chat(
      [
        { role: 'system', content: 'You are a concise assistant for a consulting firm.' },
        { role: 'user', content: q },
      ],
      { cacheSystem: true, maxTokens: 400 },
    );
    return NextResponse.json({ answer: resp.text });
  } catch (err) {
    return NextResponse.json(
      { answer: `LLM not configured: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
