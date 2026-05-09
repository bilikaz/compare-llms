import type { BenchRun, MetricUnit } from '../../types';
import { Card, Seg } from '../../ui/primitives';
import { CompletedRow } from '../../ui/bench';
import { findTest } from '../../tests';

export type Filter = 'all' | 'unrated' | 'rated';
export type SortKey = 'recent' | 'oldest' | 'fastest' | 'slowest' | 'highest' | 'lowest';

const FILTER_OPTIONS = ['all', 'unrated', 'rated'] as const;
const SORT_OPTIONS = ['recent', 'oldest', 'fastest', 'slowest', 'highest', 'lowest'] as const;

interface Props {
  runs: BenchRun[];
  totalCount: number; // pre-filter — used in the "· N" subtitle
  filter: Filter;
  sortKey: SortKey;
  unit: MetricUnit;
  onFilterChange: (f: Filter) => void;
  onSortChange: (s: SortKey) => void;
  onOpen: (id: string) => void;
}

// Persist-and-vote happens upstream; this component just renders a click row
// per completed run, with filter/sort segmented controls in the header.
export function CompletedList({
  runs,
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
          Completed runs
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
      {runs.map((r) => {
        const t = findTest(r.testId);
        const checks = t?.rubric ?? [];
        const passes = checks.filter((c) => r.rubricVotes?.[c.id] === 'pass').length;
        return (
          <CompletedRow
            key={r.id}
            test={r.testId}
            c={r.concurrency}
            dur={`${(r.durationMs / 1000).toFixed(1)}s`}
            chs={r.avgChs.toFixed(0)}
            // tok/s ≈ avgChs ÷ 4 — rough but consistent with the rest of
            // the app's chars-vs-tokens estimate.
            toks={r.avgChs > 0 ? `~${(r.avgChs / 4).toFixed(0)}` : '—'}
            unit={unit}
            vote={r.ratedAt ? 'rated' : 'unrated'}
            score={r.ratedAt ? passes : undefined}
            total={r.ratedAt ? checks.length : undefined}
            onOpen={() => onOpen(r.id)}
          />
        );
      })}
    </Card>
  );
}

// Helper used by BenchMode to compute the displayed list.
export function applyFilterAndSort(runs: BenchRun[], filter: Filter, sortKey: SortKey): BenchRun[] {
  let xs = runs;
  if (filter === 'unrated') xs = xs.filter((r) => !r.ratedAt);
  if (filter === 'rated')   xs = xs.filter((r) => !!r.ratedAt);
  // Score = number of pass votes. Unrated runs naturally score 0.
  const score = (r: BenchRun): number =>
    Object.values(r.rubricVotes ?? {}).filter((v) => v === 'pass').length;
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
