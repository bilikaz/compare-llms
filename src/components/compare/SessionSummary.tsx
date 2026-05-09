import type { ReactNode } from 'react';
import type { MetricUnit } from '../../types';
import { Card, Pill } from '../../ui/primitives';
import { ACCENT_A, ACCENT_B, fmtK, type Summary } from './utils';

interface Props {
  summary: Summary;
  unit: MetricUnit;
}

// Aggregate metrics card shown below the rubric. Renders nothing if there are
// no rounds (caller should guard on `summary` being non-null). The volume
// column (chars / tokens) follows the global unit toggle — only one is shown
// at a time so the card stays compact.
export function SessionSummary({ summary, unit }: Props) {
  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Session summary
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · {summary.totalRounds} rounds · {summary.ratedRounds} rated
        </span>
        <div style={{ flex: 1 }} />
        {summary.winner && (
          <>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-3)',
              }}
            >
              winner
            </span>
            <Pill
              color={summary.winner === 'A' ? ACCENT_A : ACCENT_B}
              bg={
                summary.winner === 'A'
                  ? 'rgba(52,211,153,0.12)'
                  : 'rgba(244,114,182,0.12)'
              }
              style={{
                borderColor:
                  summary.winner === 'A'
                    ? 'rgba(52,211,153,0.3)'
                    : 'rgba(244,114,182,0.3)',
              }}
            >
              {summary.winner} · {summary.aPct}% vs {summary.bPct}%
            </Pill>
          </>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--c-border)',
        }}
      >
        {/* avg rubric is unit-independent — it's a percentage of rubric
            checks. Volume + rate cells follow the global unit toggle. */}
        <PairCell
          label="avg rubric"
          a={`${summary.aPct}%`}
          b={`${summary.bPct}%`}
          winner={summary.winner}
        />
        {unit === 'tokens' ? (
          <PairCell
            label="tokens"
            a={
              <TokensValue
                out={summary.a.outTokens}
                outEstimated={summary.a.outTokensEstimated}
                think={summary.a.thinkTokens}
                thinkEstimated={summary.a.thinkTokensEstimated}
              />
            }
            b={
              <TokensValue
                out={summary.b.outTokens}
                outEstimated={summary.b.outTokensEstimated}
                think={summary.b.thinkTokens}
                thinkEstimated={summary.b.thinkTokensEstimated}
              />
            }
          />
        ) : (
          <PairCell
            label="chars"
            a={<CharsValue out={summary.a.outChars} think={summary.a.thinkChars} />}
            b={<CharsValue out={summary.b.outChars} think={summary.b.thinkChars} />}
          />
        )}
        {unit === 'tokens' ? (
          // tok/s is estimated from chars÷4 since the runner stores ch/s.
          <PairCell
            label="avg tok/s"
            a={`~${Math.round(summary.a.chs / 4)}`}
            b={`~${Math.round(summary.b.chs / 4)}`}
          />
        ) : (
          <PairCell label="avg ch/s" a={`${summary.a.chs}`} b={`${summary.b.chs}`} />
        )}
        <PairCell label="time" a={`${summary.a.sec.toFixed(1)}s`} b={`${summary.b.sec.toFixed(1)}s`} last />
      </div>
    </Card>
  );
}

// Total (output + thinking) in the foreground; thinking-only count in
// brackets as a dimmed aside. Mirrors the round-history row treatment so
// the eye lands on the same shape across both views.
function CharsValue({ out, think }: { out: number; think: number }) {
  const total = out + think;
  return (
    <>
      {fmtK(total)}
      {think > 0 && (
        <span style={{ color: 'var(--c-text-4)', fontWeight: 400 }}>
          {' ('}{fmtK(think)} 💡{')'}
        </span>
      )}
    </>
  );
}

function TokensValue({
  out, outEstimated, think, thinkEstimated,
}: {
  out: number; outEstimated: boolean; think: number; thinkEstimated: boolean;
}) {
  const total = out + think;
  // Once chars÷4 has touched the math the total is no longer authoritative.
  const totalEstimated = outEstimated || (think > 0 && thinkEstimated);
  return (
    <>
      {totalEstimated && '~'}{fmtK(total)}
      {think > 0 && (
        <span style={{ color: 'var(--c-text-4)', fontWeight: 400 }}>
          {' ('}{thinkEstimated && '~'}{fmtK(think)} 💡{')'}
        </span>
      )}
    </>
  );
}

// A vs B pair displayed in a single summary cell. `winner` highlights the
// leading side (used by the avg-rubric cell so the lead is glanceable).
function PairCell({
  label, a, b, winner, last,
}: {
  label: string;
  a: ReactNode;
  b: ReactNode;
  winner?: 'A' | 'B' | null;
  last?: boolean;
}) {
  const aWins = winner === 'A';
  const bWins = winner === 'B';
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRight: last ? 'none' : '1px solid var(--c-border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-3)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 3,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
        }}
      >
        <div>
          <span style={{ color: ACCENT_A, marginRight: 4 }}>A</span>
          <span style={{ color: aWins ? ACCENT_A : 'var(--c-text)' }}>{a}</span>
        </div>
        <div>
          <span style={{ color: ACCENT_B, marginRight: 4 }}>B</span>
          <span style={{ color: bWins ? ACCENT_B : 'var(--c-text)' }}>{b}</span>
        </div>
      </div>
    </div>
  );
}

