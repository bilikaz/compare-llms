import { useState, type ReactNode } from 'react';
import type { MetricUnit } from '../types';
import { Card, StatusPill, Tabs, type Status } from './primitives';
import { PreviewArea, type OverflowLevel, type ViewMode } from './PreviewArea';

export type MainBlockTab = 'preview' | 'raw' | 'thinking';

interface Props {
  // Side label ("A" / "B"). Omit for single-side blocks (Bench review).
  side?: 'A' | 'B';
  // Accent color for the side / mode (emerald / pink / blue).
  accent: string;
  provider: string;
  model: string;
  extra?: string;

  status: Status;
  // Pre-formatted strings for the metric row. Pass `—` for unknown.
  time: string;
  // chars-mode metrics. `chars` is the total (output + thinking).
  chars?: string;
  chs?: string;
  // tokens-mode metrics. `tokens` is the total (output + thinking).
  tokens?: string;
  toks?: string;
  // Bracketed thinking count rendered after the main volume metric in both
  // modes (e.g. "(318 💡)"). Pre-formatted by the caller — usually with a
  // `~` prefix when estimated, no parens (this component adds them).
  thinkBracket?: string;
  // Selects which metric subset to render in the status row.
  unit: MetricUnit;

  // Preview content. When `html` is empty/undefined, the preview shows a
  // striped placeholder. Raw + thinking show their respective text in <pre>.
  view: ViewMode;
  overflow: OverflowLevel;
  testLabel?: string;
  html?: string;
  raw?: string;
  thinking?: string;

  // Tab control. If `tab` and `onTabChange` are provided, the parent owns
  // the active tab; otherwise the component manages it internally.
  tab?: MainBlockTab;
  onTabChange?: (t: MainBlockTab) => void;
  thinkingDisabled?: boolean;

  // Right-side action slot in the title row (e.g. retry button).
  action?: ReactNode;
}

// ── Metric-row text helpers ──────────────────────────────────────────────
// Three roles share the row, each with its own emphasis. White labels (the
// load-bearing identifiers — "chars:", "in:") and white rates ("186 ch/s")
// frame the gray supporting numbers and bracketed thinking aside.

const METRIC_BASE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-sm)',
  whiteSpace: 'nowrap' as const,
};

function MetricLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{children}</span>;
}
function MetricValue({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text-3)', marginLeft: -6 }}>{children}</span>;
}
function MetricRate({ value, unit }: { value: string; unit: string }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{value} {unit}</span>;
}

// Bracketed thinking suffix rendered immediately after the main volume metric
// — same shape as the round-history rows so the eye lands consistently.
function ThinkBracket({ value }: { value: string }) {
  return (
    <span
      style={{
        ...METRIC_BASE,
        color: 'var(--c-text-4)',
        marginLeft: -6, // tuck against the value so the bracket reads as a suffix
      }}
    >
      ({value} 💡)
    </span>
  );
}

export function MainBlock({
  side,
  accent,
  provider,
  model,
  extra,
  status,
  time,
  chars = '—',
  tokens = '—',
  toks = '—',
  chs = '—',
  thinkBracket,
  unit,
  view,
  overflow,
  testLabel,
  html,
  raw,
  thinking,
  tab: tabProp,
  onTabChange,
  thinkingDisabled,
  action,
}: Props) {
  const [tabState, setTabState] = useState<MainBlockTab>('preview');
  const tab = tabProp ?? tabState;
  const setTab = (t: MainBlockTab) => {
    if (onTabChange) onTabChange(t);
    else setTabState(t);
  };

  return (
    <Card
      style={{
        padding: 'var(--pad-card)',
        borderTopColor: side ? accent : 'var(--c-border)',
        borderTopWidth: side ? 2 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--c-text-3)',
            }}
          >
            {provider}
            {side && <span style={{ marginLeft: 6, color: accent }}>· {side}</span>}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-md)',
              color: accent,
              fontWeight: 600,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {model || <span style={{ color: 'var(--c-text-4)' }}>(no model)</span>}
            {extra && (
              <span style={{ color: 'var(--c-text-3)', fontWeight: 400, marginLeft: 6 }}>
                [{extra}]
              </span>
            )}
          </div>
        </div>
        {action}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        <StatusPill status={status} time={time} />
        <div style={{ flex: 1 }} />
        {/* Metric row mirrors the round-history rows: white "label:" first,
            gray value next, then bracketed thinking, then a white rate
            ("186 ch/s" / "18 tok/s"). Consistent typography across panels. */}
        {unit === 'tokens' ? (
          <>
            <MetricLabel>tokens:</MetricLabel>
            <MetricValue>{tokens}</MetricValue>
            {thinkBracket && <ThinkBracket value={thinkBracket} />}
            <MetricRate value={toks} unit="tok/s" />
          </>
        ) : (
          <>
            <MetricLabel>chars:</MetricLabel>
            <MetricValue>{chars}</MetricValue>
            {thinkBracket && <ThinkBracket value={thinkBracket} />}
            <MetricRate value={chs} unit="ch/s" />
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Tabs<MainBlockTab>
          value={tab}
          onChange={setTab}
          items={[
            'preview',
            'raw',
            { value: 'thinking', label: 'thinking', disabled: !!thinkingDisabled },
          ]}
        />
      </div>

      {tab === 'preview' && (
        <PreviewArea view={view} html={html} testLabel={testLabel} overflow={overflow} />
      )}

      {tab === 'raw' && (
        <pre
          style={{
            margin: 0,
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 5,
            padding: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-2)',
            overflow: 'auto',
            maxHeight: 320,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {raw ?? ''}
        </pre>
      )}

      {tab === 'thinking' && (
        <pre
          style={{
            margin: 0,
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 5,
            padding: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-3)',
            fontStyle: 'italic',
            overflow: 'auto',
            maxHeight: 320,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {thinking ?? ''}
        </pre>
      )}
    </Card>
  );
}
