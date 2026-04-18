// Naive token-ish chunker: split on paragraph, pack up to ~900 chars per chunk
// with 150-char overlap. Good enough for nomic-embed-text (~8k token window).
export interface Chunk {
  ord: number;
  text: string;
}

export function chunkText(text: string, size = 900, overlap = 150): Chunk[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buf = '';
  let ord = 0;
  const push = () => {
    if (buf.trim()) chunks.push({ ord: ord++, text: buf.trim() });
  };
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > size) {
      push();
      buf = buf.slice(Math.max(0, buf.length - overlap)) + '\n\n' + p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
  }
  push();
  return chunks;
}
