import type { MetricUnit } from '../../types';
import { Card, Seg } from '../../ui/primitives';
import { CompletedRow } from '../../ui/bench';
import { findTest } from '../../tests';
import type { Test } from '../../bench/data/Test';

export type Filter = 'all' | 'unrated' | 'rated';
export type SortKey = 'recent' | 'oldest' | 'fastest' | 'slowest' | 'highest' | 'lowest';

const FILTER_OPTIONS = ['all', 'unrated', 'rated'] as const;
const SORT_OPTIONS = ['recent', 'oldest', 'fastest', 'slowest', 'highest', 'lowest'] as const;

interface Props {
  tests: Test[];
  totalCount: number; // pre-filter — used in the "· N" subtitle
  filter: Filter;
  sortKey: SortKey;
  unit: MetricUnit;
  onFilterChange: (f: Filter) => void;
  onSortChange: (s: SortKey) => void;
  onOpen: (id: string) => void;
}

// Persist-and-vote happens upstream; this component just renders a click row
// per completed Test, with filter/sort segmented controls in the header.
export function CompletedList({
  tests,
  totalCount,
  filter,
  sortKey,
  unit,
  onFilterChange,
  onSortChange,
  onOpen,
}: Props) {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderBottom: '1px solid var(--c-border)',
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
          Completed tests
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · {totalCount}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-3)',
          }}
        >
          filter
        </span>
        <Seg<Filter> options={FILTER_OPTIONS} value={filter} onChange={onFilterChange} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-3)',
          }}
        >
          sort
        </span>
        <Seg<SortKey> options={SORT_OPTIONS} value={sortKey} onChange={onSortChange} />
      </div>
      {tests.map((t) => {
        const def = findTest(t.testId);
        const checks = def?.rubric ?? [];
        const passes = checks.filter((c) => t.rubricVotes?.[c.id] === 'pass').length;
        const chs = t.charsPerSec();
        return (
          <CompletedRow
            key={t.id}
            test={t.testId}
            c={t.concurrency}
            dur={`${(t.durationMs / 1000).toFixed(1)}s`}
            chs={chs.toFixed(0)}
            // tok/s ≈ chs ÷ 4 — rough but consistent with the rest of
            // the app's chars-vs-tokens estimate.
            toks={chs > 0 ? `~${(chs / 4).toFixed(0)}` : '—'}
            unit={unit}
            vote={t.ratedAt ? 'rated' : 'unrated'}
            score={t.ratedAt ? passes : undefined}
            total={t.ratedAt ? checks.length : undefined}
            onOpen={() => onOpen(t.id)}
          />
        );
      })}
    </Card>
  );
}

// Helper used by BenchMode to compute the displayed list.
export function applyFilterAndSort(tests: Test[], filter: Filter, sortKey: SortKey): Test[] {
  let xs = tests;
  if (filter === 'unrated') xs = xs.filter((t) => !t.ratedAt);
  if (filter === 'rated')   xs = xs.filter((t) => !!t.ratedAt);
  // Score = number of pass votes. Unrated tests naturally score 0.
  const score = (t: Test): number =>
    Object.values(t.rubricVotes ?? {}).filter((v) => v === 'pass').length;
  const sorted = [...xs];
  switch (sortKey) {
    case 'recent':  sorted.sort((a, b) => b.startedAt - a.startedAt); break;
    case 'oldest':  sorted.sort((a, b) => a.startedAt - b.startedAt); break;
    case 'fastest': sorted.sort((a, b) => a.durationMs - b.durationMs); break;
    case 'slowest': sorted.sort((a, b) => b.durationMs - a.durationMs); break;
    case 'highest': sorted.sort((a, b) => score(b) - score(a)); break;
    case 'lowest':  sorted.sort((a, b) => score(a) - score(b)); break;
  }
  return sorted;
}
