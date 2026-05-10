import type { MetricUnit } from '../../types';
import { Card } from '../../ui/primitives';
import { ACCENT_BENCH, ColHead } from './utils';

// Lean per-c row — populated by Bench from its Batch[] + schedule. Got is
// undefined until the first Run at that c finishes successfully (no live
// data sneaks in here; all values are scalar accumulators).
export interface PerCRow {
  c: number;
  expectedRuns: number;     // total scheduled Runs at this c
  expectedTests: number;    // total scheduled Test slots at this c
  got?: {
    runCount: number;       // completed Runs at this c
    doneTestCount: number;  // completed Tests at this c
    sumWindowMs: number;    // for wall-clock-ish display
    avgChs: number;
    peakChs: number;
    minChs: number;
  };
}

interface Props {
  rows: PerCRow[];
  unit: MetricUnit;
}

const COLUMNS = '60px 90px 90px 110px 80px 80px';

export function PerCStatsCard({ rows, unit }: Props) {
  const headers = unit === 'tokens'
    ? ['level', 'progress', 'window', 'avg tok/s', 'peak', 'min']
    : ['level', 'progress', 'window', 'avg ch/s', 'peak', 'min'];
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
  const liveTier = !!got && got.doneTestCount < row.expectedTests;
  const empty = !got;
  // For tokens we estimate from chars÷4 since the engine stores per-c
  // throughput in characters; the per-c aggregate inherits that estimate.
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
        background: liveTier ? 'rgba(96,165,250,0.04)' : 'transparent',
      }}
    >
      <span style={{ color: ACCENT_BENCH, fontWeight: 600 }}>c={row.c}</span>
      <span
        style={{
          color: got && got.doneTestCount === row.expectedTests
            ? 'var(--c-accent-a)'
            : 'var(--c-text-2)',
        }}
      >
        {empty ? `— / ${row.expectedTests}` : `${got!.doneTestCount} / ${row.expectedTests}`}
      </span>
      <span style={{ color: 'var(--c-text-2)' }}>
        {got ? `${(got.sumWindowMs / 1000).toFixed(1)}s` : '—'}
      </span>
      <span style={{ color: 'var(--c-text)', fontWeight: liveTier ? 600 : 400 }}>
        {got ? fmtAvg(got.avgChs) : '—'}
      </span>
      <span style={{ color: 'var(--c-text-2)' }}>{got ? fmtAvg(got.peakChs) : '—'}</span>
      <span style={{ color: 'var(--c-text-2)' }}>{got ? fmtAvg(got.minChs) : '—'}</span>
    </div>
  );
}
