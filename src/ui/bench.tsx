import type { MetricUnit } from '../types';
import { Btn, Card, Metric, Pill, StatusPill, Tabs, type Status } from './primitives';
import { PreviewArea, type OverflowLevel, type ViewMode } from './PreviewArea';

// ── ScheduleRow (one tier line in the schedule preview card) ─────────────
export function ScheduleRow({
  tier, runs, total, accent = 'var(--c-accent-bench)',
}: {
  tier: string;
  runs: string;
  total: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 80px',
        gap: 14,
        padding: '8px 0',
        borderBottom: '1px solid var(--c-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        alignItems: 'center',
      }}
    >
      <span style={{ color: accent, fontWeight: 600 }}>{tier}</span>
      <span style={{ color: 'var(--c-text-2)' }}>{runs}</span>
      <span style={{ color: 'var(--c-text-3)', textAlign: 'right' }}>{total} runs</span>
    </div>
  );
}

// ── SlotPane (one slot in the bench active block) ────────────────────────
interface SlotPaneProps {
  test: string;
  status: Status;
  time: string;
  chs?: string;
  toks?: string;
  unit: MetricUnit;
  view: ViewMode;
  overflow: OverflowLevel;
  html?: string;
  raw?: string;
  thinking?: string;
  thinkingDisabled?: boolean;
  accent?: string;
  // tab is currently always 'preview' since the slot is mini; keeping the
  // control around so future iterations can opt into raw/thinking inline.
}

export function SlotPane({
  test,
  status,
  time,
  chs = '—',
  toks = '—',
  unit,
  view,
  overflow,
  html,
  thinkingDisabled,
  accent = 'var(--c-accent-bench)',
}: SlotPaneProps) {
  return (
    <Card style={{ padding: 'var(--pad-tight)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
            color: accent,
            fontWeight: 600,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {test}
        </span>
        <div style={{ flex: 1 }} />
        <StatusPill status={status} time={time} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        {unit === 'tokens' ? (
          <Metric label="tok/s" value={toks} accent="var(--c-text)" />
        ) : (
          <Metric label="ch/s" value={chs} accent="var(--c-text)" />
        )}
      </div>
      <Tabs<'preview' | 'raw' | 'thinking'>
        value="preview"
        items={[
          'preview',
          'raw',
          { value: 'thinking', label: 'thinking', disabled: !!thinkingDisabled },
        ]}
      />
      <div style={{ marginTop: 8 }}>
        <PreviewArea view={view} html={html} testLabel={test} overflow={overflow} mini />
      </div>
    </Card>
  );
}

// ── CompletedRow (one row in the bench completed-runs list) ──────────────
export function CompletedRow({
  test, c, dur, chs, toks, unit, vote, score, total,
  onOpen, onDelete,
}: {
  test: string;
  c: number;
  dur: string;
  chs: string;
  // Throughput in tokens/sec when the unit toggle is set to 'tokens'. Falls
  // back to '—' if neither a real nor estimated value is available.
  toks?: string;
  unit: MetricUnit;
  vote: 'unrated' | 'rated';
  score?: number;
  total?: number;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 60px 80px 80px auto auto auto',
        gap: 14,
        padding: '9px 12px',
        borderBottom: '1px solid var(--c-border)',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <span style={{ color: 'var(--c-text-3)' }}>▸</span>
      <span style={{ color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {test}
      </span>
      <Pill
        color="var(--c-accent-bench)"
        bg="rgba(96,165,250,0.08)"
        style={{ borderColor: 'rgba(96,165,250,0.3)' }}
      >
        c={c}
      </Pill>
      <span style={{ color: 'var(--c-text-2)' }}>{dur}</span>
      {unit === 'tokens' ? (
        <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>{toks ?? '—'} tok/s</span>
      ) : (
        <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>{chs} ch/s</span>
      )}
      {vote === 'unrated' ? (
        <Pill>☐ unrated</Pill>
      ) : (
        <Pill
          color="var(--c-accent-bench)"
          bg="rgba(96,165,250,0.08)"
          style={{ borderColor: 'rgba(96,165,250,0.3)' }}
        >
          ✓ {score}/{total}
        </Pill>
      )}
      {onOpen && <Btn onClick={onOpen}>open</Btn>}
      {onDelete && <Btn onClick={onDelete}>×</Btn>}
    </div>
  );
}
