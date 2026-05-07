import { useState } from 'react';
import type { Round } from '../types';
import { Preview } from './Preview';

interface Props {
  rounds: Round[];
  onRate: (roundId: string, side: 'A' | 'B', rating: number) => void;
  onDelete: (roundId: string) => void;
}

export function RoundHistory({ rounds, onRate, onDelete }: Props) {
  if (!rounds.length) return null;
  return (
    <div className="mt-6 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Past rounds ({rounds.length})</h2>
      {rounds.slice().reverse().map((r) => (
        <RoundRow key={r.id} round={r} onRate={onRate} onDelete={onDelete} />
      ))}
    </div>
  );
}

function RoundRow({ round, onRate, onDelete }: { round: Round; onRate: Props['onRate']; onDelete: Props['onDelete'] }) {
  const [open, setOpen] = useState(false);
  const winner =
    round.resultA.rating != null && round.resultB.rating != null
      ? round.resultA.rating > round.resultB.rating ? 'A'
      : round.resultB.rating > round.resultA.rating ? 'B' : 'tie'
      : null;

  return (
    <div className="border rounded-md" style={{ borderColor: '#1f1f1f' }}>
      <button
        className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-900/50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 text-xs flex-1 min-w-0">
          <span className="text-neutral-500">{open ? '▾' : '▸'}</span>
          <span className="text-neutral-300 truncate flex-1">{round.prompt}</span>
        </div>
        <div className="flex items-center gap-3 text-xs whitespace-nowrap">
          <span className="text-emerald-400">A: {round.resultA.rating ?? '—'}</span>
          <span className="text-pink-400">B: {round.resultB.rating ?? '—'}</span>
          <span className="text-neutral-500">{(round.resultA.durationMs / 1000).toFixed(1)}s / {(round.resultB.durationMs / 1000).toFixed(1)}s</span>
          {winner && <span className="text-yellow-300">{winner === 'tie' ? 'tie' : `${winner} ✓`}</span>}
        </div>
      </button>
      {open && (
        <div className="border-t border-neutral-900 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['A', 'B'] as const).map((side) => {
              const r = side === 'A' ? round.resultA : round.resultB;
              const cfg = side === 'A' ? round.configA : round.configB;
              const accent = side === 'A' ? '#34d399' : '#f472b6';
              return (
                <div key={side} className="border border-neutral-900 rounded">
                  <div className="px-2 py-1 text-xs flex justify-between">
                    <span style={{ color: accent }}>
                      {cfg.model || cfg.label}
                      {cfg.extra && <span className="text-neutral-400"> [{cfg.extra}]</span>}
                    </span>
                    <span className="text-neutral-500">
                      {r.usage.outputTokens != null ? `${r.usage.outputTokens} tok` : `${r.charCount} ch`}
                      {' · '}{(r.durationMs / 1000).toFixed(1)}s
                      {r.durationMs > 0 && r.charCount > 0 && (
                        <> · {(r.charCount / (r.durationMs / 1000)).toFixed(1)} ch/s</>
                      )}
                      {r.usage.thinkingTokens != null && ` · ${r.usage.thinkingTokens} think`}
                    </span>
                  </div>
                  <div className="h-48 bg-black">
                    {r.error ? <div className="p-2 text-xs text-red-400">{r.error}</div> : <Preview text={r.text} size="square" />}
                  </div>
                  <div className="p-2 flex items-center gap-1 text-xs">
                    <span className="text-neutral-400">rate:</span>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => onRate(round.id, side, n)}
                        className={`w-6 h-6 rounded border ${r.rating === n ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => onDelete(round.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >delete round</button>
          </div>
        </div>
      )}
    </div>
  );
}
