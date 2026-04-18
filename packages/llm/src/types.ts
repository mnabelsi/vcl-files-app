export type Tier = 'bulk' | 'structured' | 'synthesis' | 'premium';

export type TaskKind =
  | 'chunk-extract'
  | 'classify'
  | 'dedup'
  | 'version-diff'
  | 'client-extract'
  | 'user-query'
  | 'cross-doc-synthesis';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  // For Anthropic: if true, mark system + last-system-like schema block with cache_control.
  cacheSystem?: boolean;
  temperature?: number;
  maxTokens?: number;
  // When set, provider should coerce output to valid JSON.
  json?: boolean;
  jsonSchemaHint?: string;
}

export interface ChatResponse {
  text: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}

export interface EmbedResponse {
  vectors: number[][];
  model: string;
  dim: number;
}

export interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResponse>;
  embed?(texts: string[]): Promise<EmbedResponse>;
}
