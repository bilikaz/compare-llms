import type { BuiltSchedule } from '../../bench/schedule';
import { Btn, Card, Pill } from '../../ui/primitives';
import { ScheduleRow } from '../../ui/bench';
import { ACCENT_BENCH, ColHead } from './utils';

interface Props {
  schedule: BuiltSchedule;
  startDisabled: boolean;
  onStart: () => void;
}

// The empty-session view: shows the standardized 112-run schedule (boss/hard/
// medium/easy phases) and a start button. The schedule is deterministically
// generated upstream; this component is presentation-only.
export function SchedulePreview({ schedule, startDisabled, onStart }: Props) {
  const totalRuns = schedule.batches.reduce((s, b) => s + b.tests.length, 0);
  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Schedule
        </div>
        <Pill color={ACCENT_BENCH}>Standardized 112-run</Pill>
        <div style={{ flex: 1 }} />
      </div>
      <div
        style={{
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 6,
          padding: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 80px',
            gap: 14,
            paddingBottom: 6,
            borderBottom: '1px solid var(--c-border-2)',
          }}
        >
          <ColHead>tier</ColHead>
          <ColHead>batches</ColHead>
          <ColHead align="right">count</ColHead>
        </div>
        {/* Hard-coded tier rows match the standardized schedule phases. If the
            schedule shape changes (new tiers, new c-values), update here. */}
        <ScheduleRow tier="boss"   runs="c=1 ×6, c=2 ×4"   total={14} />
        <ScheduleRow tier="hard"   runs="c=3 ×2, c=4 ×2"   total={14} />
        <ScheduleRow tier="medium" runs="c=6 ×2, c=8 ×2"   total={28} />
        <ScheduleRow tier="easy"   runs="c=12 ×2, c=16 ×2" total={56} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-md)',
          }}
        >
          <span style={{ color: 'var(--c-text-3)' }}>total</span>
          <span style={{ color: ACCENT_BENCH, fontWeight: 600 }}>
            {totalRuns} runs · {schedule.batches.length} batches
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-3)',
          }}
        >
          sample throughput at every c level · ~{schedule.batches.length} batches
        </span>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={onStart} disabled={startDisabled}>
          ▶ start session
        </Btn>
      </div>
    </Card>
  );
}
