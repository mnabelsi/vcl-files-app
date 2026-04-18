import { OllamaProvider } from './ollama.js';
import { AnthropicProvider } from './anthropic.js';
import type { LLMProvider, TaskKind, Tier } from './types.js';

export interface RouterEnv {
  OLLAMA_URL: string;
  OLLAMA_CHAT_MODEL: string;
  OLLAMA_EMBED_MODEL: string;
  OLLAMA_EMBED_DIM: number;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_HAIKU_MODEL: string;
  ANTHROPIC_SONNET_MODEL: string;
  ANTHROPIC_OPUS_MODEL: string;
}

// Task -> tier mapping. Tiers: bulk (Ollama), structured (Haiku),
// synthesis (Sonnet), premium (Opus).
const TASK_TIER: Record<TaskKind, Tier> = {
  'chunk-extract': 'bulk',
  classify: 'bulk',
  dedup: 'bulk',
  'version-diff': 'bulk',
  'client-extract': 'structured',
  'user-query': 'synthesis',
  'cross-doc-synthesis': 'premium',
};

export class LLMRouter {
  private ollama: OllamaProvider;
  private haiku: AnthropicProvider;
  private sonnet: AnthropicProvider;
  private opus: AnthropicProvider;

  constructor(env: RouterEnv) {
    this.ollama = new OllamaProvider({
      url: env.OLLAMA_URL,
      chatModel: env.OLLAMA_CHAT_MODEL,
      embedModel: env.OLLAMA_EMBED_MODEL,
      embedDim: env.OLLAMA_EMBED_DIM,
    });
    this.haiku = new AnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_HAIKU_MODEL,
    });
    this.sonnet = new AnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_SONNET_MODEL,
    });
    this.opus = new AnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_OPUS_MODEL,
    });
  }

  providerFor(task: TaskKind): LLMProvider {
    return this.providerForTier(TASK_TIER[task]);
  }

  providerForTier(tier: Tier): LLMProvider {
    switch (tier) {
      case 'bulk':
        return this.ollama;
      case 'structured':
        return this.haiku;
      case 'synthesis':
        return this.sonnet;
      case 'premium':
        return this.opus;
    }
  }

  embedder(): LLMProvider {
    return this.ollama;
  }
}

export function routerFromEnv(): LLMRouter {
  const env = process.env;
  const required = [
    'OLLAMA_URL',
    'OLLAMA_CHAT_MODEL',
    'OLLAMA_EMBED_MODEL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_HAIKU_MODEL',
    'ANTHROPIC_SONNET_MODEL',
    'ANTHROPIC_OPUS_MODEL',
  ];
  for (const k of required) if (!env[k]) throw new Error(`missing env: ${k}`);
  return new LLMRouter({
    OLLAMA_URL: env.OLLAMA_URL!,
    OLLAMA_CHAT_MODEL: env.OLLAMA_CHAT_MODEL!,
    OLLAMA_EMBED_MODEL: env.OLLAMA_EMBED_MODEL!,
    OLLAMA_EMBED_DIM: Number(env.OLLAMA_EMBED_DIM ?? 768),
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY!,
    ANTHROPIC_HAIKU_MODEL: env.ANTHROPIC_HAIKU_MODEL!,
    ANTHROPIC_SONNET_MODEL: env.ANTHROPIC_SONNET_MODEL!,
    ANTHROPIC_OPUS_MODEL: env.ANTHROPIC_OPUS_MODEL!,
  });
}
