import type { MetricUnit } from '../../types';
import type { PerCAggregate } from '../../bench/runner';
import { Card, Sparkline } from '../../ui/primitives';
import { ACCENT_BENCH, ColHead } from './utils';

// Each row carries the aggregate (`got`) when at least one run at that c-level
// has completed, plus the total `expected` count for that c so we can show
// "n / N" progress for phases that are partially done or haven't started.
export interface PerCRow {
  c: number;
  expected: number;
  got?: PerCAggregate;
}

interface Props {
  rows: PerCRow[];
  unit: MetricUnit;
}

const COLUMNS = '60px 90px 90px 110px 90px 110px';

export function PerCStatsCard({ rows, unit }: Props) {
  const headers = unit === 'tokens'
    ? ['level', 'progress', 'wall-clock', 'avg tok/s', 'peak', 'throughput']
    : ['level', 'progress', 'wall-clock', 'avg ch/s', 'peak', 'throughput'];
  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Concurrency stats
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · per c level
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          gap: 14,
          paddingBottom: 6,
          borderBottom: '1px solid var(--c-border-2)',
        }}
      >
        {headers.map((h) => (
          <ColHead key={h}>{h}</ColHead>
        ))}
      </div>
      {rows.map((row) => (
        <Row key={row.c} row={row} unit={unit} />
      ))}
    </Card>
  );
}

function Row({ row, unit }: { row: PerCRow; unit: MetricUnit }) {
  const { got } = row;
  const live = !!got && got.completedRuns < got.totalRuns;
  const empty = !got;
  // For tokens we estimate from chars÷4 since runs persist chars-per-second
  // rather than tokens-per-second; the per-c aggregate inherits that estimate.
  const fmtAvg = (v: number) => unit === 'tokens' ? `~${(v / 4).toFixed(0)}` : v.toFixed(0);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COLUMNS,
        gap: 14,
        padding: '8px 0',
        borderBottom: '1px solid var(--c-border)',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        opacity: empty ? 0.5 : 1,
        background: live ? 'rgba(96,165,250,0.04)' : 'transparent',
      }}
    >
      <span style={{ color: ACCENT_BENCH, fontWeight: 600 }}>c={row.c}</span>
      <span
        style={{
          color: got && got.completedRuns === row.expected ? 'var(--c-accent-a)' : 'var(--c-text-2)',
        }}
      >
        {empty ? `— / ${row.expected}` : `${got!.completedRuns} / ${row.expected}`}
      </span>
      <span style={{ color: 'var(--c-text-2)' }}>
        {got ? `${(got.wallClockMs / 1000).toFixed(1)}s` : '—'}
      </span>
      <span style={{ color: 'var(--c-text)', fontWeight: live ? 600 : 400 }}>
        {got ? fmtAvg(got.avgChs) : '—'}
      </span>
      <span style={{ color: 'var(--c-text-2)' }}>{got ? fmtAvg(got.peakChs) : '—'}</span>
      {empty ? (
        <span style={{ color: 'var(--c-text-4)' }}>—</span>
      ) : (
        // Synthetic ramp through avg → peak. Replace with real per-c samples
        // when we start retaining batch-level char timeseries on disk.
        <Sparkline
          width={100}
          height={18}
          data={[
            got!.avgChs * 0.5,
            got!.avgChs * 0.7,
            got!.avgChs * 0.8,
            got!.avgChs,
            got!.peakChs,
            got!.avgChs * 0.9,
          ]}
          peak={live}
        />
      )}
    </div>
  );
}
