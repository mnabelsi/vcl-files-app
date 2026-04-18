import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbedResponse,
  LLMProvider,
} from './types.js';

export interface OllamaConfig {
  url: string;
  chatModel: string;
  embedModel: string;
  embedDim: number;
}

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  constructor(private cfg: OllamaConfig) {}

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResponse> {
    const res = await fetch(`${this.cfg.url}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.cfg.chatModel,
        messages,
        stream: false,
        format: opts.json ? 'json' : undefined,
        options: {
          temperature: opts.temperature ?? 0.2,
          num_predict: opts.maxTokens ?? 1024,
        },
      }),
    });
    if (!res.ok) throw new Error(`ollama chat failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    return {
      text: data.message?.content ?? '',
      model: this.cfg.chatModel,
      tokensIn: data.prompt_eval_count,
      tokensOut: data.eval_count,
    };
  }

  async embed(texts: string[]): Promise<EmbedResponse> {
    // Ollama supports a batch endpoint in recent versions; fall back to loop.
    const vectors: number[][] = [];
    for (const t of texts) {
      const res = await fetch(`${this.cfg.url}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.cfg.embedModel, prompt: t }),
      });
      if (!res.ok)
        throw new Error(`ollama embed failed: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { embedding: number[] };
      vectors.push(data.embedding);
    }
    return { vectors, model: this.cfg.embedModel, dim: this.cfg.embedDim };
  }
}
