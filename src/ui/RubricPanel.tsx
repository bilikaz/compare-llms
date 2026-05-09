import { Fragment, useState, type ReactNode } from 'react';
import { Card, Pill, Seg } from './primitives';
import type { RubricCheck } from '../tests';
import type { RubricVote, RubricVotes } from '../types';

type Sort = 'unrated-first' | 'order';
const SORT_OPTIONS = [
  { value: 'unrated-first' as const, label: 'unrated first' },
  { value: 'order' as const, label: 'in order' },
];

// One ✓ / ✗ pair for a single side. Click again to clear.
function VoteCell({
  vote,
  accentPass,
  onChange,
}: {
  vote: RubricVote | undefined;
  accentPass: string;
  onChange: (v: RubricVote | undefined) => void;
}) {
  const btn = (label: string, isOn: boolean, onBg: string, onFg: string, target: RubricVote) => (
    <button
      onClick={() => onChange(vote === target ? undefined : target)}
      style={{
        width: 26,
        height: 22,
        borderRadius: 4,
        border: '1px solid var(--c-border-2)',
        background: isOn ? onBg : 'var(--c-bg)',
        color: isOn ? onFg : 'var(--c-text-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {btn('✓', vote === 'pass', accentPass, '#0a0a0a', 'pass')}
      {btn('✗', vote === 'fail', 'var(--c-fail)', '#fee2e2', 'fail')}
    </div>
  );
}

export interface RubricPanelProps {
  checks: RubricCheck[];
  // Compare (two-side) mode: pass votesA + votesB + onVote(side, ...).
  // Single mode: pass votesSingle + onVoteSingle.
  votesA?: RubricVotes | undefined;
  votesB?: RubricVotes | undefined;
  votesSingle?: RubricVotes | undefined;
  onVote?: (side: 'A' | 'B', checkId: string, vote: RubricVote | undefined) => void;
  onVoteSingle?: (checkId: string, vote: RubricVote | undefined) => void;
  accentA?: string;
  accentB?: string;
  accent?: string; // single-side accent (Bench)
}

export function RubricPanel(props: RubricPanelProps) {
  const {
    checks,
    votesA, votesB, votesSingle,
    onVote, onVoteSingle,
    accentA = 'var(--c-accent-a)',
    accentB = 'var(--c-accent-b)',
    accent = 'var(--c-accent-bench)',
  } = props;
  const single = !onVote && !!onVoteSingle;
  const [sort, setSort] = useState<Sort>('unrated-first');

  // Build a stable, indexable list so we can preserve display numbers when
  // sorting unrated-first.
  const rows = checks.map((c, i) => {
    const a = votesA?.[c.id];
    const b = votesB?.[c.id];
    const s = votesSingle?.[c.id];
    return { ...c, _i: i, voteA: a, voteB: b, voteSingle: s };
  });
  const isUnrated = (r: typeof rows[number]) => single
    ? r.voteSingle == null
    : r.voteA == null || r.voteB == null;
  const items = sort === 'unrated-first'
    ? [...rows].sort((x, y) => Number(isUnrated(y)) - Number(isUnrated(x)))
    : rows;
  const unratedCount = rows.filter(isUnrated).length;
  const splitIdx = items.findIndex((it) => !isUnrated(it));

  // Tally pass counts.
  const aPass = rows.filter((r) => r.voteA === 'pass').length;
  const bPass = rows.filter((r) => r.voteB === 'pass').length;
  const sPass = rows.filter((r) => r.voteSingle === 'pass').length;

  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-base)', color: 'var(--c-text)', fontWeight: 600 }}>
          Rubric
        </div>
        <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)' }}>
          · {checks.length} checks · <span style={{ color: 'var(--c-text-2)' }}>{unratedCount} unrated</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--c-text-3)' }}>sort</span>
        <Seg<Sort> options={SORT_OPTIONS} value={sort} onChange={setSort} accent={single ? accent : undefined} />
        {single ? (
          <Pill color={accent}>{sPass}/{checks.length}</Pill>
        ) : (
          <>
            <Pill color={accentA}>A {aPass}/{checks.length}</Pill>
            <Pill color={accentB}>B {bPass}/{checks.length}</Pill>
          </>
        )}
      </div>
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: single ? '1fr auto' : '1fr auto auto',
          gap: 14,
          padding: '0 0 6px',
          borderBottom: '1px solid var(--c-border-2)',
        }}
      >
        <ColHead>criterion</ColHead>
        {single ? <ColHead>vote</ColHead> : (
          <>
            <ColHead color={accentA}>A</ColHead>
            <ColHead color={accentB}>B</ColHead>
          </>
        )}
      </div>
      {items.map((it, i) => (
        <Fragment key={it.id}>
          {sort === 'unrated-first' && i === splitIdx && splitIdx > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 0 6px',
                borderBottom: '1px solid var(--c-border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--c-text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                already voted
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: single ? '1fr auto' : '1fr auto auto',
              gap: 14,
              padding: '8px 0',
              borderBottom: '1px solid var(--c-border)',
              alignItems: 'flex-start',
              opacity: !isUnrated(it) && sort === 'unrated-first' ? 0.6 : 1,
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--fs-base)', color: 'var(--c-text)', fontWeight: 500 }}>
                <span
                  style={{
                    color: 'var(--c-text-3)',
                    marginRight: 8,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {String(it._i + 1).padStart(2, '0')}
                </span>
                {it.label}
              </div>
              {it.verify && (
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--c-text-3)',
                    marginTop: 3,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.4,
                  }}
                >
                  {it.verify}
                </div>
              )}
            </div>
            {single ? (
              <VoteCell
                vote={it.voteSingle}
                accentPass={accent}
                onChange={(v) => onVoteSingle?.(it.id, v)}
              />
            ) : (
              <>
                <VoteCell vote={it.voteA} accentPass={accentA} onChange={(v) => onVote?.('A', it.id, v)} />
                <VoteCell vote={it.voteB} accentPass={accentB} onChange={(v) => onVote?.('B', it.id, v)} />
              </>
            )}
          </div>
        </Fragment>
      ))}
      {single && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-md)',
          }}
        >
          <span style={{ color: 'var(--c-text-3)' }}>score:&nbsp;</span>
          <span style={{ color: accent, fontWeight: 600 }}>{sPass}/{checks.length}</span>
        </div>
      )}
    </Card>
  );
}

function ColHead({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontSize: 'var(--fs-xs)',
        color: color ?? 'var(--c-text-3)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontWeight: color ? 600 : 400,
      }}
    >
      {children}
    </div>
  );
}
