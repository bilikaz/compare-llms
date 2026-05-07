import type { ModelConfig, StreamEvent } from '../types';
import { parseSSE } from './sse';

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  if (b.endsWith('/v1') || b.endsWith('/openai/v1')) return `${b}${path}`;
  return `${b}/v1${path}`;
}

export async function* streamOpenAI(
  cfg: ModelConfig,
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const url = joinUrl(cfg.baseUrl, '/chat/completions');
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      stream_options: { include_usage: true },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    yield { type: 'error', message: `${res.status} ${res.statusText} ${errText}`.trim() };
    return;
  }

  for await (const data of parseSSE(res, signal)) {
    if (data === '[DONE]') break;
    if (!data) continue;
    let evt: any;
    try { evt = JSON.parse(data); } catch { continue; }
    const choice = evt.choices?.[0];
    const delta = choice?.delta;
    if (delta) {
      // Some providers expose thinking via reasoning_content (DeepSeek) or reasoning (others)
      const reasoning = delta.reasoning_content ?? delta.reasoning;
      if (typeof reasoning === 'string' && reasoning.length) {
        yield { type: 'thinking', delta: reasoning };
      }
      if (typeof delta.content === 'string' && delta.content.length) {
        yield { type: 'text', delta: delta.content };
      }
    }
    if (evt.usage) {
      yield {
        type: 'usage',
        usage: {
          inputTokens: evt.usage.prompt_tokens,
          outputTokens: evt.usage.completion_tokens,
          thinkingTokens: evt.usage.completion_tokens_details?.reasoning_tokens,
        },
      };
    }
  }
  yield { type: 'done' };
}

export async function listOpenAIModels(cfg: Pick<ModelConfig, 'baseUrl' | 'apiKey'>): Promise<string[]> {
  const url = joinUrl(cfg.baseUrl, '/models');
  const res = await fetch(url, {
    headers: { ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  const list: any[] = data.data ?? data.models ?? [];
  return list.map((m) => m.id ?? m.name).filter(Boolean);
}
