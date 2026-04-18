import { parseByFilename } from '@vcl/extract';
import { LLMRouter } from '@vcl/llm';
import { getDb, chunks as chunksTable, files } from '@vcl/db';
import { eq } from 'drizzle-orm';
import { chunkText } from './chunk.js';

export async function processFile(args: {
  fileId: string;
  name: string;
  buffer: Buffer;
  router: LLMRouter;
}): Promise<{ chunkCount: number }> {
  const db = getDb();
  const parsed = await parseByFilename(args.name, args.buffer);
  const pieces = chunkText(parsed.text);

  if (pieces.length === 0) {
    await db.update(files).set({ status: 'extracted' }).where(eq(files.id, args.fileId));
    return { chunkCount: 0 };
  }

  const embed = await args.router.embedder().embed!(pieces.map((p) => p.text));

  await db.insert(chunksTable).values(
    pieces.map((p, i) => ({
      fileId: args.fileId,
      ord: p.ord,
      text: p.text,
      embedding: embed.vectors[i],
      embeddingModel: embed.model,
    })),
  );

  await db.update(files).set({ status: 'extracted' }).where(eq(files.id, args.fileId));
  return { chunkCount: pieces.length };
}
