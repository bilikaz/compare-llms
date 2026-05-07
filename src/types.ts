export type ProviderKind = 'openai' | 'anthropic' | 'gemini';

export interface ModelConfig {
  id: string;
  label: string;
  provider: ProviderKind;
  baseUrl: string;
  model: string;
  apiKey: string;
  extra?: string;
}

export interface StreamUsage {
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
}

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'thinking'; delta: string }
  | { type: 'usage'; usage: StreamUsage }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface RoundResult {
  side: 'A' | 'B';
  text: string;
  thinking: string;
  usage: StreamUsage;
  durationMs: number;
  error?: string;
  rating?: number;
  charCount: number;
  thinkingCharCount: number;
}

export interface Round {
  id: string;
  prompt: string;
  startedAt: number;
  configA: ModelConfig;
  configB: ModelConfig;
  resultA: RoundResult;
  resultB: RoundResult;
}

export interface AppState {
  configA: ModelConfig;
  configB: ModelConfig;
  rounds: Round[];
}
