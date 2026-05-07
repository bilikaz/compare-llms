import type { ModelConfig, StreamEvent } from '../types';
import { parseSSE } from './sse';

function baseFor(cfg: ModelConfig): string {
  return (cfg.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
}

export async function* streamAnthropic(
  cfg: ModelConfig,
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const url = `${baseFor(cfg)}/v1/messages`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 8192,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    yield { type: 'error', message: `${res.status} ${res.statusText} ${errText}`.trim() };
    return;
  }

  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  for await (const data of parseSSE(res, signal)) {
    if (!data) continue;
    let evt: any;
    try { evt = JSON.parse(data); } catch { continue; }
    switch (evt.type) {
      case 'message_start': {
        const u = evt.message?.usage;
        if (u) { inputTokens = u.input_tokens; outputTokens = u.output_tokens; }
        break;
      }
      case 'content_block_delta': {
        const d = evt.delta;
        if (d?.type === 'text_delta' && d.text) yield { type: 'text', delta: d.text };
        else if (d?.type === 'thinking_delta' && d.thinking) yield { type: 'thinking', delta: d.thinking };
        break;
      }
      case 'message_delta': {
        const u = evt.usage;
        if (u) outputTokens = u.output_tokens ?? outputTokens;
        break;
      }
      case 'message_stop': {
        yield { type: 'usage', usage: { inputTokens, outputTokens } };
        break;
      }
    }
  }
  yield { type: 'done' };
}

export async function listAnthropicModels(cfg: Pick<ModelConfig, 'baseUrl' | 'apiKey'>): Promise<string[]> {
  const url = `${(cfg.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/models`;
  const res = await fetch(url, {
    headers: {
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.data ?? []).map((m: any) => m.id).filter(Boolean);
}
