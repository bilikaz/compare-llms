import type { ModelConfig, StreamEvent } from '../types';

function baseFor(cfg: ModelConfig): string {
  return (cfg.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
}

// Gemini streaming: streamGenerateContent with alt=sse returns SSE.
export async function* streamGemini(
  cfg: ModelConfig,
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const url = `${baseFor(cfg)}/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    yield { type: 'error', message: `${res.status} ${res.statusText} ${errText}`.trim() };
    return;
  }

  if (!res.body) { yield { type: 'error', message: 'No body' }; return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastUsage: any = null;

  try {
    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trimStart();
        if (!payload) continue;
        let evt: any;
        try { evt = JSON.parse(payload); } catch { continue; }
        const parts = evt.candidates?.[0]?.content?.parts ?? [];
        for (const p of parts) {
          if (typeof p.text !== 'string') continue;
          if (p.thought) yield { type: 'thinking', delta: p.text };
          else yield { type: 'text', delta: p.text };
        }
        if (evt.usageMetadata) lastUsage = evt.usageMetadata;
        if (evt.candidates?.[0]?.finishReason) {
          // keep reading until done in case usage comes later
        }
        if (signal.aborted) break outer;
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* noop */ }
  }

  if (lastUsage) {
    yield {
      type: 'usage',
      usage: {
        inputTokens: lastUsage.promptTokenCount,
        outputTokens: lastUsage.candidatesTokenCount,
        thinkingTokens: lastUsage.thoughtsTokenCount,
      },
    };
  }
  yield { type: 'done' };
}

export async function listGeminiModels(cfg: Pick<ModelConfig, 'baseUrl' | 'apiKey'>): Promise<string[]> {
  const url = `${(cfg.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')}/v1beta/models?key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.models ?? [])
    .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m: any) => (m.name ?? '').replace(/^models\//, ''))
    .filter(Boolean);
}
