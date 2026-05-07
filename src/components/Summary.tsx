import type { Round } from '../types';

interface Props { rounds: Round[]; }

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function Summary({ rounds }: Props) {
  if (!rounds.length) return null;

  const ratedA = rounds.map(r => r.resultA.rating).filter((v): v is number => typeof v === 'number' && v > 0);
  const ratedB = rounds.map(r => r.resultB.rating).filter((v): v is number => typeof v === 'number' && v > 0);
  const avgA = avg(ratedA);
  const avgB = avg(ratedB);
  const totalDurA = rounds.reduce((s, r) => s + r.resultA.durationMs, 0);
  const totalDurB = rounds.reduce((s, r) => s + r.resultB.durationMs, 0);
  const realTokA = rounds.reduce((s, r) => s + (r.resultA.usage.outputTokens ?? 0) + (r.resultA.usage.thinkingTokens ?? 0), 0);
  const realTokB = rounds.reduce((s, r) => s + (r.resultB.usage.outputTokens ?? 0) + (r.resultB.usage.thinkingTokens ?? 0), 0);
  const charsA = rounds.reduce((s, r) => s + r.resultA.charCount + r.resultA.thinkingCharCount, 0);
  const charsB = rounds.reduce((s, r) => s + r.resultB.charCount + r.resultB.thinkingCharCount, 0);
  const tokA = realTokA > 0 ? realTokA : Math.round(charsA / 4);
  const tokB = realTokB > 0 ? realTokB : Math.round(charsB / 4);
  const tokEstA = realTokA === 0;
  const tokEstB = realTokB === 0;
  const cpsA = totalDurA > 0 ? charsA / (totalDurA / 1000) : 0;
  const cpsB = totalDurB > 0 ? charsB / (totalDurB / 1000) : 0;
  const tpsA = totalDurA > 0 && tokA > 0 ? tokA / (totalDurA / 1000) : 0;
  const tpsB = totalDurB > 0 && tokB > 0 ? tokB / (totalDurB / 1000) : 0;

  const Cell = ({ label, a, b, hi }: { label: string; a: string; b: string; hi?: 'A' | 'B' | null }) => (
    <div className="grid grid-cols-3 gap-3 px-3 py-1 text-xs">
      <div className="text-neutral-400">{label}</div>
      <div className={hi === 'A' ? 'text-emerald-300 font-bold' : 'text-emerald-200'}>{a}</div>
      <div className={hi === 'B' ? 'text-pink-300 font-bold' : 'text-pink-200'}>{b}</div>
    </div>
  );

  const winner = avgA != null && avgB != null
    ? avgA > avgB ? 'A' : avgB > avgA ? 'B' : null
    : null;

  return (
    <div className="border rounded-md mt-3" style={{ borderColor: '#1f1f1f' }}>
      <div className="px-3 py-2 border-b border-neutral-900 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-neutral-300 font-bold">Overall ({rounds.length} round{rounds.length !== 1 ? 's' : ''})</span>
        {winner && <span className="text-xs text-yellow-300">winner: {winner}</span>}
      </div>
      <Cell label="avg rating" a={avgA?.toFixed(2) ?? '—'} b={avgB?.toFixed(2) ?? '—'} hi={winner} />
      <Cell label="rated rounds" a={String(ratedA.length)} b={String(ratedB.length)} />
      <Cell label="total chars" a={String(charsA)} b={String(charsB)} />
      <Cell label="total tokens" a={`${tokEstA ? '~' : ''}${tokA}`} b={`${tokEstB ? '~' : ''}${tokB}`} />
      <Cell label="total time" a={`${(totalDurA / 1000).toFixed(1)}s`} b={`${(totalDurB / 1000).toFixed(1)}s`} />
      <Cell label="tokens/s" a={tpsA ? `${tokEstA ? '~' : ''}${tpsA.toFixed(1)}` : '—'} b={tpsB ? `${tokEstB ? '~' : ''}${tpsB.toFixed(1)}` : '—'} />
      <Cell label="chars/s" a={cpsA ? cpsA.toFixed(1) : '—'} b={cpsB ? cpsB.toFixed(1) : '—'} />
    </div>
  );
}
