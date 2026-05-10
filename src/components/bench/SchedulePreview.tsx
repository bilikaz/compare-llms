import { useState } from 'react';
import type { BuiltSchedule } from '../../bench/schedule';
import { Btn, Card, Pill, Seg } from '../../ui/primitives';
import { ACCENT_BENCH, ColHead } from './utils';

export type ScheduleMode = 'standardized' | 'custom';
const MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: 'standardized', label: 'Standardized 112-run' },
  { value: 'custom', label: 'Custom...' },
];

interface Props {
  schedule: BuiltSchedule;
  startDisabled: boolean;
  // Caller passes the built schedule back so the orchestrator stays
  // schedule-agnostic (same path used by CustomBuilder).
  onStart: (s: BuiltSchedule) => void;
  mode: ScheduleMode;
  onModeChange: (m: ScheduleMode) => void;
}

// Per-batch row used inside expanded tier groups. Mirrors the custom
// schedule's "all batches" row layout: index · c-pill · [tests].
function BatchRowView({ batch }: { batch: BatchRow }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 60px 1fr',
        gap: 12,
        padding: '7px 8px',
        borderBottom: '1px solid var(--c-border)',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <span style={{ color: 'var(--c-text-3)' }}>
        {String(batch.globalIndex).padStart(2, '0')}.
      </span>
      <Pill
        color={ACCENT_BENCH}
        bg="rgba(96,165,250,0.08)"
        style={{ borderColor: 'rgba(96,165,250,0.3)' }}
      >
        c={batch.c}
      </Pill>
      <span style={{ color: 'var(--c-text-2)', wordBreak: 'break-word' }}>
        [{batch.tests.join(', ')}]
      </span>
    </div>
  );
}

function tierOf(batchTests: string[]): string {
  return batchTests[0]?.split('-')[0] ?? '';
}

interface BatchRow {
  id: string;
  globalIndex: number;   // 1-based index across the whole schedule
  c: number;             // batch.tests.length
  tests: string[];       // raw test ids (full names with prefix)
}

interface TierGroup {
  tier: string;
  batches: BatchRow[];
  totalSlots: number;
}

function groupByTier(schedule: BuiltSchedule): TierGroup[] {
  const order: string[] = [];
  const map = new Map<string, TierGroup>();
  schedule.batches.forEach((b, i) => {
    const tier = tierOf(b.tests);
    if (!map.has(tier)) {
      map.set(tier, { tier, batches: [], totalSlots: 0 });
      order.push(tier);
    }
    const g = map.get(tier)!;
    g.batches.push({ id: b.id, globalIndex: i + 1, c: b.tests.length, tests: b.tests });
    g.totalSlots += b.tests.length;
  });
  return order.map((t) => map.get(t)!);
}

// The empty-session view: schedule grouped by tier (collapsed by default,
// click to expand and see per-batch test names) + start button.
export function SchedulePreview({ schedule, startDisabled, onStart, mode, onModeChange }: Props) {
  const totalRuns = schedule.batches.reduce((s, b) => s + b.tests.length, 0);
  const groups = groupByTier(schedule);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (tier: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier); else next.add(tier);
      return next;
    });
  };
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
        <Seg<ScheduleMode>
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          accent={ACCENT_BENCH}
        />
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
            gridTemplateColumns: '110px 1fr 100px',
            gap: 14,
            paddingBottom: 6,
            borderBottom: '1px solid var(--c-border-2)',
          }}
        >
          <ColHead>tier</ColHead>
          <ColHead>runs</ColHead>
          <ColHead align="right">total</ColHead>
        </div>
        {groups.map((g) => {
          const isOpen = expanded.has(g.tier);
          return (
            <div key={g.tier}>
              <button
                type="button"
                onClick={() => toggle(g.tier)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 100px',
                  gap: 14,
                  width: '100%',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--c-border)',
                  background: 'transparent',
                  border: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  color: 'inherit',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: ACCENT_BENCH, fontWeight: 600 }}>
                  <span style={{ color: 'var(--c-text-3)', marginRight: 6 }}>{isOpen ? '▾' : '▸'}</span>
                  {g.tier}
                </span>
                <span style={{ color: 'var(--c-text-3)' }}>
                  {g.batches.length} runs
                </span>
                <span style={{ color: 'var(--c-text-3)', textAlign: 'right' }}>
                  {g.totalSlots} tests
                </span>
              </button>
              {isOpen && (
                <div style={{ paddingLeft: 22 }}>
                  {g.batches.map((b) => (
                    <BatchRowView key={b.id} batch={b} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
            {totalRuns} tests · {schedule.batches.length} runs
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
          sample throughput at every c level · ~{schedule.batches.length} runs
        </span>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={() => onStart(schedule)} disabled={startDisabled}>
          ▶ start session
        </Btn>
      </div>
    </Card>
  );
}
