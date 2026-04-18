import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  LLMProvider,
} from './types.js';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

/**
 * Anthropic provider with prompt caching enabled on system + schema blocks.
 * Caching is critical for token cost: per-chunk extraction reuses a large
 * system prompt + schema, so we mark those with cache_control.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor(private cfg: AnthropicConfig) {
    this.client = new Anthropic({ apiKey: cfg.apiKey });
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResponse> {
    const systemMsgs = messages.filter((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');

    // Build a system array with cache_control on each block when cacheSystem is true.
    // Anthropic allows up to 4 cache breakpoints per request. We mark the last
    // system block (typically the schema / instructions) as ephemeral cached.
    const systemBlocks = systemMsgs.map((m, i) => {
      const isLast = i === systemMsgs.length - 1;
      return {
        type: 'text' as const,
        text: m.content,
        ...(opts.cacheSystem && isLast
          ? { cache_control: { type: 'ephemeral' as const } }
          : {}),
      };
    });

    const resp = await this.client.messages.create({
      model: this.cfg.model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.2,
      system: systemBlocks.length ? systemBlocks : undefined,
      messages: nonSystem.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return {
      text,
      model: this.cfg.model,
      tokensIn: resp.usage.input_tokens,
      tokensOut: resp.usage.output_tokens,
      cacheReadInputTokens: (resp.usage as { cache_read_input_tokens?: number })
        .cache_read_input_tokens,
      cacheCreationInputTokens: (resp.usage as { cache_creation_input_tokens?: number })
        .cache_creation_input_tokens,
    };
  }
}
