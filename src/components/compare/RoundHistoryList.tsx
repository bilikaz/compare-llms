import type { ReactNode } from 'react';
import type { MetricUnit, Round, RoundResult, StreamUsage } from '../../types';
import { Card } from '../../ui/primitives';
import { RoundRow } from '../../ui/RoundRow';
import { findTest } from '../../tests';
import { ACCENT_A, ACCENT_B, fmtK } from './utils';

interface Props {
  rounds: Round[];
  reviewingId: string | null;
  unit: MetricUnit;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

// Rough English heuristic — providers that don't report token counts get
// estimated as chars÷4. Used in many places; keep the same constant so the
// `tok/s` numbers stay consistent across views.
const TOKENS_PER_CHAR = 1 / 4;

// Total (output + thinking) in the foreground, thinking-only count in
// brackets. Reads "14.0k (3.5k 💡)" — the prominent number is the full
// volume the model produced, the bracketed aside surfaces how much of
// that was reasoning vs final output.
function VolumeText({
  out, outEstimated, think, thinkEstimated,
}: { out: number; outEstimated?: boolean; think: number; thinkEstimated?: boolean }) {
  const total = out + think;
  // Total is estimated whenever any component was — once chars÷4 has
  // touched the math, the result is no longer authoritative.
  const totalEstimated = !!outEstimated || (think > 0 && !!thinkEstimated);
  return (
    <>
      {totalEstimated && '~'}{fmtK(total)}
      {think > 0 && (
        <span style={{ color: 'var(--c-text-4)' }}>
          {' ('}{thinkEstimated && '~'}{fmtK(think)} 💡{')'}
        </span>
      )}
    </>
  );
}

// Build a SideBundle for one side of a round, in the unit the user picked.
function bundleFor(r: RoundResult, unit: MetricUnit, score: ReactNode, status: string | undefined): {
  score: ReactNode; status?: string; unitLabel: string; volume: ReactNode; rate: string; time: string;
} {
  const sec = r.durationMs / 1000;
  const time = `${sec.toFixed(1)}s`;
  if (unit === 'tokens') {
    const out = pickTokens(r.usage.outputTokens, r.charCount);
    const think = pickTokens(r.usage.thinkingTokens, r.thinkingCharCount);
    const total = out.value + think.value;
    const rateNum = sec > 0 ? Math.round(total / sec) : 0;
    // If any component is estimated the rate is too — once chars÷4 has
    // touched the math, the number is no longer authoritative.
    const rateEstimated = out.estimated || think.estimated;
    return {
      score,
      status,
      unitLabel: 'tokens:',
      volume: (
        <VolumeText
          out={out.value}
          outEstimated={out.estimated}
          think={think.value}
          thinkEstimated={think.estimated}
        />
      ),
      rate: `${rateEstimated ? '~' : ''}${rateNum} tok/s`,
      time,
    };
  }
  const total = r.charCount + r.thinkingCharCount;
  const rateNum = sec > 0 ? Math.round(total / sec) : 0;
  return {
    score,
    status,
    unitLabel: 'chars:',
    volume: <VolumeText out={r.charCount} think={r.thinkingCharCount} />,
    rate: `${rateNum} ch/s`,
    time,
  };
}

// `real` from the provider when present; otherwise fall back to chars÷4.
// We track which we used so the renderer can prefix `~` for estimates.
function pickTokens(real: number | undefined, chars: number): { value: number; estimated: boolean } {
  if (real != null) return { value: real, estimated: false };
  return { value: Math.round(chars * TOKENS_PER_CHAR), estimated: true };
}

// Reverse-chronological list of past rounds. Each row is clickable — the
// whole row triggers `onLoad`, the inner load/delete buttons too. The card
// also handles the empty case (returns null) so callers don't have to guard.
export function RoundHistoryList({ rounds, reviewingId, unit, onLoad, onDelete }: Props) {
  if (rounds.length === 0) return null;
  return (
    <Card>
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Round history
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · {rounds.length} round{rounds.length !== 1 ? 's' : ''}
        </span>
      </div>
      {[...rounds].reverse().map((r, idx) => {
        const t = findTest(r.testId);
        const checks = t?.rubric ?? [];
        // Score per side. Preset tests use rubric pass-count, custom prompts
        // use the 1-10 rating (which we display as "N/10"). Half-rated
        // rubric rounds keep their partial number but in a dim color.
        const scoreFor = (rr: RoundResult): ReactNode => {
          if (checks.length === 0) {
            // custom prompt — fall back to the 1–10 rating
            return rr.rating != null
              ? `${rr.rating}/10`
              : <span style={{ color: 'var(--c-text-3)' }}>—</span>;
          }
          const pass = checks.reduce((n, c) => n + (rr.rubricVotes?.[c.id] === 'pass' ? 1 : 0), 0);
          const rated = checks.every((c) => rr.rubricVotes?.[c.id]);
          return rated
            ? `${pass}/${checks.length}`
            : <span style={{ color: 'var(--c-text-3)' }}>{pass}/{checks.length}</span>;
        };

        // Round status (medal). Comparable scores per side:
        //   preset: rubric pass count
        //   custom: 1–10 rating
        // Either way we need both sides fully rated; otherwise no medal.
        let aValue: number | null = null;
        let bValue: number | null = null;
        if (checks.length === 0) {
          aValue = r.resultA.rating ?? null;
          bValue = r.resultB.rating ?? null;
        } else {
          const aRated = checks.every((c) => r.resultA.rubricVotes?.[c.id]);
          const bRated = checks.every((c) => r.resultB.rubricVotes?.[c.id]);
          if (aRated) aValue = checks.reduce((n, c) => n + (r.resultA.rubricVotes?.[c.id] === 'pass' ? 1 : 0), 0);
          if (bRated) bValue = checks.reduce((n, c) => n + (r.resultB.rubricVotes?.[c.id] === 'pass' ? 1 : 0), 0);
        }
        let aStatus: string | undefined;
        let bStatus: string | undefined;
        if (aValue != null && bValue != null) {
          if (aValue > bValue) { aStatus = '🥇'; bStatus = '🥈'; }
          else if (bValue > aValue) { aStatus = '🥈'; bStatus = '🥇'; }
          else { aStatus = bStatus = '🤝'; }
        }
        return (
          <div key={r.id} onClick={() => onLoad(r.id)} style={{ cursor: 'pointer' }}>
            <RoundRow
              n={rounds.length - idx}
              test={`${r.testId ?? 'custom'}${t ? ` · ${t.title}` : ''}`}
              a={bundleFor(r.resultA, unit, scoreFor(r.resultA), aStatus)}
              b={bundleFor(r.resultB, unit, scoreFor(r.resultB), bStatus)}
              time={new Date(r.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              current={reviewingId === r.id}
              accentA={ACCENT_A}
              accentB={ACCENT_B}
              onLoad={() => onLoad(r.id)}
              onDelete={() => onDelete(r.id)}
            />
          </div>
        );
      })}
    </Card>
  );
}

// (Kept for potential future use — useless re-export protector.)
export type { StreamUsage };
