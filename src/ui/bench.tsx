import { useState } from 'react';
import type { MetricUnit } from '../types';
import { Btn, Card, Pill, StatusPill, Tabs, type Status } from './primitives';
import { PreviewArea, type OverflowLevel, type ViewMode } from './PreviewArea';

type SlotTab = 'preview' | 'raw' | 'thinking';

// Aspect ratios for the raw/thinking text panes — picked so each pane has
// the SAME height as the preview iframe at the active view, while filling
// the full column width.
//
// PreviewArea uses these aspects with the iframe pinned to 100% width for
// 1:1 and HD, but caps 9:16 at 50% width (otherwise it would tower 1.78×
// the column width). To match that visual height at full width we use 9/8
// — derived from `(colW / 2) * (16/9) = colW * 8/9` → aspect = 9/8.
const SLOT_ASPECT: Record<ViewMode, string> = {
  '1:1':  '1 / 1',
  HD:     '16 / 9',
  '9:16': '9 / 8',
};

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
      <span style={{ color: 'var(--c-text-2)', wordBreak: 'break-word' }}>{runs}</span>
      <span style={{ color: 'var(--c-text-3)', textAlign: 'right' }}>{total} tests</span>
    </div>
  );
}

// ── SlotPane (one slot in the bench active block) ────────────────────────
interface SlotPaneProps {
  test: string;
  status: Status;
  time: string;
  // Pre-formatted metrics — same shape as MainBlock so the metric row reads
  // identically across modes: `chars: N (M 💡) X ch/s` (or tokens variant).
  chars?: string;
  tokens?: string;
  chs?: string;
  toks?: string;
  // Bracketed thinking-only count (e.g. "1,250" or "~318"). Omit when the
  // model produced no reasoning.
  thinkBracket?: string;
  unit: MetricUnit;
  view: ViewMode;
  overflow: OverflowLevel;
  html?: string;
  raw?: string;
  thinking?: string;
  thinkingDisabled?: boolean;
  accent?: string;
  // Show a restart (↻) button next to the status pill. Wire from the bench
  // orchestrator's per-slot SlotControl — kills the in-flight stream and
  // spawns a fresh attempt for the same test in the same slot index.
  // Useful when a model loops in <thinking> and stalls the batch.
  onRestart?: () => void;
}

const METRIC_BASE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-xs)',
  whiteSpace: 'nowrap' as const,
};

function MLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{children}</span>;
}
function MValue({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text-3)', marginLeft: -4 }}>{children}</span>;
}
function MThink({ value }: { value: string }) {
  return (
    <span style={{ ...METRIC_BASE, color: 'var(--c-text-4)', marginLeft: -4 }}>
      ({value} 💡)
    </span>
  );
}
function MRate({ value, unit }: { value: string; unit: string }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{value} {unit}</span>;
}

export function SlotPane({
  test,
  status,
  time,
  chars = '—',
  tokens = '—',
  chs = '—',
  toks = '—',
  thinkBracket,
  unit,
  view,
  overflow,
  html,
  raw,
  thinking,
  thinkingDisabled,
  accent = 'var(--c-accent-bench)',
  onRestart,
}: SlotPaneProps) {
  const [tab, setTab] = useState<SlotTab>('preview');
  // Auto-leave a tab if the data behind it disappears (e.g. thinking gets
  // disabled because the model never produced reasoning).
  if (tab === 'thinking' && thinkingDisabled) setTab('preview');
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
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            title="restart this slot (kill + retry same test)"
            style={{
              padding: '2px 6px',
              background: 'transparent',
              color: 'var(--c-text-3)',
              border: '1px solid var(--c-border)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ↻
          </button>
        )}
        <StatusPill status={status} time={time} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        {unit === 'tokens' ? (
          <>
            <MLabel>tokens:</MLabel>
            <MValue>{tokens}</MValue>
            {thinkBracket && <MThink value={thinkBracket} />}
            <MRate value={toks} unit="tok/s" />
          </>
        ) : (
          <>
            <MLabel>chars:</MLabel>
            <MValue>{chars}</MValue>
            {thinkBracket && <MThink value={thinkBracket} />}
            <MRate value={chs} unit="ch/s" />
          </>
        )}
      </div>
      <Tabs<SlotTab>
        value={tab}
        onChange={setTab}
        items={[
          'preview',
          'raw',
          { value: 'thinking', label: 'thinking', disabled: !!thinkingDisabled },
        ]}
      />
      <div style={{ marginTop: 8 }}>
        {tab === 'preview' && (
          <PreviewArea view={view} html={html} testLabel={test} overflow={overflow} mini />
        )}
        {(tab === 'raw' || tab === 'thinking') && (
          <div
            style={{
              width: '100%',
              aspectRatio: SLOT_ASPECT[view],
            }}
          >
            <pre
              style={{
                margin: 0,
                width: '100%',
                height: '100%',
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 5,
                padding: 8,
                boxSizing: 'border-box',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-xs)',
                color: tab === 'thinking' ? 'var(--c-text-3)' : 'var(--c-text-2)',
                fontStyle: tab === 'thinking' ? 'italic' : 'normal',
                overflow: 'auto',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {(tab === 'thinking' ? thinking : raw) ?? ''}
            </pre>
          </div>
        )}
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
