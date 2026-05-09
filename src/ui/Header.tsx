import type { ReactNode } from 'react';
import type { MetricUnit, Mode } from '../types';
import { Btn, Seg } from './primitives';

export function Logo() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-md)',
        fontWeight: 600,
        letterSpacing: -0.2,
      }}
    >
      <span style={{ color: 'var(--c-accent-a)' }}>compare</span>
      <span style={{ color: 'var(--c-text-3)' }}>-</span>
      <span style={{ color: 'var(--c-accent-b)' }}>llms</span>
    </div>
  );
}

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  // Global metric unit. The toggle lives in the header (next to mode) so it's
  // glanceable from anywhere in the app — switching it re-renders chars/tokens
  // displays everywhere at once.
  unit: MetricUnit;
  onUnitChange: (u: MetricUnit) => void;
  // Right-edge info text (e.g. "4 rounds · indexeddb" or "session 7c4f · indexeddb")
  info?: string;
  // Click handler for the export button. When undefined, the button is hidden.
  onExport?: () => void;
  // Mode-specific buttons rendered before the export button (e.g. Compare's
  // show/hide configs toggle). Each mode is responsible for what it puts here.
  extraActions?: ReactNode;
}

const MODE_OPTIONS = [
  { value: 'compare' as const, label: 'Compare' },
  { value: 'bench' as const, label: 'Benchmark' },
];

const UNIT_OPTIONS = [
  { value: 'chars' as const, label: 'chars' },
  { value: 'tokens' as const, label: 'tokens' },
];

// Tooltip text on the unit toggle — explains why some token counts appear
// with a `~` prefix (the provider didn't report usage so we estimate as
// chars÷4). Lives on the toggle itself rather than as visible body text so
// the header stays compact.
const UNIT_TOOLTIP =
  'Display throughput / volume in characters or tokens.\n'
  + 'Tokens come from the provider when reported (Anthropic, OpenAI, Gemini).\n'
  + 'When not reported (most vLLM, some Qwen/DeepSeek), tokens are estimated\n'
  + 'as chars÷4 and prefixed with ~ to mark the estimate.';

export function Header({ mode, onModeChange, unit, onUnitChange, info, onExport, extraActions }: Props) {
  const accent = mode === 'compare' ? 'var(--c-accent-a)' : 'var(--c-accent-bench)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 14px',
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
      }}
    >
      <Logo />
      <div style={{ width: 1, height: 18, background: 'var(--c-border)', margin: '0 4px' }} />
      <Seg<Mode> options={MODE_OPTIONS} value={mode} onChange={onModeChange} accent={accent} />
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-3)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
        title={UNIT_TOOLTIP}
      >
        units
      </span>
      <div title={UNIT_TOOLTIP}>
        <Seg<MetricUnit> options={UNIT_OPTIONS} value={unit} onChange={onUnitChange} />
      </div>
      {info && (
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {info}
        </span>
      )}
      {extraActions}
      {onExport && <Btn onClick={onExport}>↓ export</Btn>}
    </div>
  );
}
