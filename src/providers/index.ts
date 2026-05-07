import type { ModelConfig, StreamEvent } from '../types';
import { streamOpenAI, listOpenAIModels } from './openai';
import { streamAnthropic, listAnthropicModels } from './anthropic';
import { streamGemini, listGeminiModels } from './gemini';

export function streamModel(
  cfg: ModelConfig,
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  switch (cfg.provider) {
    case 'openai': return streamOpenAI(cfg, prompt, signal);
    case 'anthropic': return streamAnthropic(cfg, prompt, signal);
    case 'gemini': return streamGemini(cfg, prompt, signal);
  }
}

export async function listModels(cfg: ModelConfig): Promise<string[]> {
  switch (cfg.provider) {
    case 'openai': return listOpenAIModels(cfg);
    case 'anthropic': return listAnthropicModels(cfg);
    case 'gemini': return listGeminiModels(cfg);
  }
}

export function defaultBaseUrl(provider: ModelConfig['provider']): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com';
    case 'anthropic': return 'https://api.anthropic.com';
    case 'gemini': return 'https://generativelanguage.googleapis.com';
  }
}
