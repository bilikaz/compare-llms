import { useState } from 'react';
import type { ModelConfig, RoundResult } from '../types';
import { Preview, type PreviewSize } from './Preview';
import { Rating } from './Rating';

type Tab = 'preview' | 'raw' | 'thinking';

function ContentBox({ size, children }: { size: PreviewSize; children: React.ReactNode }) {
  if (size === 'fit') {
    return (
      <div className="flex-1 min-h-[400px] bg-black border-t border-neutral-900 relative">
        <div className="absolute inset-0">{children}</div>
      </div>
    );
  }
  const aspect = size === 'square' ? '1 / 1' : '16 / 9';
  return (
    <div className="bg-black border-t border-neutral-900 relative w-full" style={{ aspectRatio: aspect }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

interface Props {
  config: ModelConfig;
  result: RoundResult;
  status: 'idle' | 'streaming' | 'done' | 'error';
  elapsedMs: number;
  accent: string;
  size: PreviewSize;
  onRetry?: () => void;
  onRate?: (rating: number) => void;
  showRating?: boolean;
}

export function StreamPanel({ config, result, status, elapsedMs, accent, size, onRetry, onRate, showRating }: Props) {
  const [tab, setTab] = useState<Tab>('preview');

  const seconds = (elapsedMs / 1000).toFixed(1);
  const statusLabel =
    status === 'idle' ? 'idle' :
    status === 'streaming' ? `streaming [${seconds}s]` :
    status === 'error' ? 'error' :
    `Done [${seconds}s]`;

  // Rate: include text + thinking chars so it's live during reasoning phase too.
  // Tokens preferred over chars; estimate as chars/4 while streaming, swap to actuals
  // once the server sends usage in the final chunk.
  const elapsedSec = (elapsedMs > 0 ? elapsedMs : result.durationMs) / 1000;
  const totalChars = result.charCount + result.thinkingCharCount;
  const actualTokens =
    (result.usage.outputTokens ?? 0) + (result.usage.thinkingTokens ?? 0);
  const tokens = actualTokens > 0 ? actualTokens : totalChars / 4;
  const tokensEstimated = actualTokens === 0;
  const tokensPerSec = elapsedSec > 0 && tokens > 0 ? tokens / elapsedSec : 0;
  const charsPerSec = elapsedSec > 0 ? totalChars / elapsedSec : 0;

  return (
    <div className="border rounded-md flex flex-col overflow-hidden min-w-0" style={{ borderColor: '#1f1f1f' }}>
      <div className="px-3 pt-3 pb-2 flex items-baseline justify-between">
        <div>
          <div className="text-neutral-400 text-xs">{config.provider}</div>
          <div className="text-2xl font-bold leading-tight" style={{ color: accent }}>
            {config.model || config.label}
            {config.extra && <span className="text-neutral-400 font-normal"> [{config.extra}]</span>}
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-2 py-1"
          >retry</button>
        )}
      </div>

      <div className="px-3 pb-2 flex items-center justify-between text-xs gap-2 flex-wrap">
        <span className={status === 'error' ? 'text-red-400' : status === 'done' ? 'text-emerald-400' : 'text-neutral-400'}>
          {status === 'done' && '✓ '}{statusLabel}
        </span>
        <div className="flex gap-3 text-neutral-500 flex-wrap">
          {result.usage.outputTokens != null && <span>{result.usage.outputTokens} out</span>}
          {result.usage.inputTokens != null && <span>{result.usage.inputTokens} in</span>}
          {result.usage.thinkingTokens != null && <span>{result.usage.thinkingTokens} think</span>}
          <span>{totalChars} chars</span>
          {tokensPerSec > 0 && (
            <span className="text-neutral-200 font-bold">
              {tokensEstimated && '~'}{tokensPerSec.toFixed(1)} tok/s
            </span>
          )}
          {totalChars > 0 && elapsedSec > 0 && (
            <span className="text-neutral-500">{charsPerSec.toFixed(1)} ch/s</span>
          )}
        </div>
      </div>

      <div className="px-3 pb-2 flex gap-1 text-xs">
        {(['preview', 'raw', 'thinking'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={t === 'thinking' && !result.thinking}
            className={`px-2 py-1 rounded border ${tab === t ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-900 border-neutral-800'} disabled:opacity-30`}
          >
            {t}{t === 'thinking' && result.thinkingCharCount ? ` (${result.thinkingCharCount})` : ''}
          </button>
        ))}
      </div>

      <ContentBox size={size}>
        {result.error ? (
          <div className="p-3 text-sm text-red-400 whitespace-pre-wrap overflow-auto h-full">{result.error}</div>
        ) : tab === 'preview' ? (
          <Preview text={result.text} size={size} />
        ) : tab === 'raw' ? (
          <pre className="p-3 text-xs text-neutral-200 whitespace-pre-wrap break-words overflow-auto h-full m-0">{result.text}</pre>
        ) : (
          <pre className="p-3 text-xs text-amber-300 whitespace-pre-wrap break-words overflow-auto h-full m-0">{result.thinking}</pre>
        )}
      </ContentBox>

      {showRating && status === 'done' && onRate && (
        <div className="border-t border-neutral-900 px-3 py-2">
          <Rating value={result.rating} onChange={onRate} />
        </div>
      )}
    </div>
  );
}
