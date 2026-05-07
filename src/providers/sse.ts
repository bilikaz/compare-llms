// Minimal SSE line parser. Yields decoded "data:" lines from a fetch Response body.
export async function* parseSSE(response: Response, signal?: AbortSignal): AsyncGenerator<string> {
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (line.startsWith('data:')) {
          yield line.slice(5).trimStart();
        }
      }
    }
    if (buffer.startsWith('data:')) yield buffer.slice(5).trimStart();
  } finally {
    try { reader.releaseLock(); } catch { /* noop */ }
  }
}
