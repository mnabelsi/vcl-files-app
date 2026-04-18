export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export async function tavilySearch(args: {
  apiKey: string;
  query: string;
  maxResults?: number;
}): Promise<TavilyResult[]> {
  if (!args.apiKey) return []; // stub-safe
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: args.apiKey,
      query: args.query,
      max_results: args.maxResults ?? 5,
      search_depth: 'basic',
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`tavily failed: ${res.status}`);
  const j = (await res.json()) as { results?: TavilyResult[] };
  return j.results ?? [];
}
