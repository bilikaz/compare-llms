import type { LiveRun } from '../../bench/runner';
import { Btn, Card, Metric, Sparkline } from '../../ui/primitives';
import { ACCENT_BENCH, fmtDuration } from './utils';

interface Props {
  // The currently-running batch. Caller derives this from session.batches[currentBatchIndex].
  phase: { c: number; batchIndex: number; total: number };
  liveSlots: LiveRun[];
  // Sparkline points for the active phase (sum chars/sec across slots).
  sparklineData: number[];
  // Pre-computed: completed runs / total scheduled runs across the whole session.
  completedCount: number;
  totalRuns: number;
  running: boolean;
  onStop: () => void;
}

// Top card of the active session view. Shows phase number, batch progress,
// elapsed time of the current batch, and a live ch/s sparkline. The progress
// bar at the bottom reflects whole-session progress (completed / total runs).
export function PhaseHeader({
  phase,
  liveSlots,
  sparklineData,
  completedCount,
  totalRuns,
  running,
  onStop,
}: Props) {
  // Batch elapsed = max sample time across live slots (they all started at the
  // same instant, so the leading slot's last sample is the batch wall-clock).
  const batchElapsedMs = liveSlots.reduce(
    (max, r) => Math.max(max, r.charSamples.at(-1)?.t ?? 0),
    0,
  );
  const progressPct = totalRuns > 0 ? (completedCount / totalRuns) * 100 : 0;

  return (
    <Card style={{ padding: 'var(--pad-card)', borderLeft: `3px solid ${ACCENT_BENCH}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-md)',
            fontWeight: 600,
          }}
        >
          <span style={{ color: 'var(--c-text-3)' }}>phase </span>
          <span style={{ color: ACCENT_BENCH }}>c={phase.c}</span>
        </span>
        <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>·</span>
        <Metric
          label="batch"
          value={`${phase.batchIndex + 1} / ${phase.total}`}
          accent="var(--c-text)"
        />
        <Metric label="elapsed" value={fmtDuration(batchElapsedMs)} accent="var(--c-text)" />
        {sparklineData.length > 0 && (
          <>
            <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>·</span>
            <Sparkline width={140} data={sparklineData} peak />
          </>
        )}
        <div style={{ flex: 1 }} />
        {running && (
          <Btn danger onClick={onStop}>
            ■ stop session
          </Btn>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          height: 4,
          background: 'var(--c-border)',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div style={{ width: `${progressPct}%`, background: ACCENT_BENCH }} />
      </div>
    </Card>
  );
}
