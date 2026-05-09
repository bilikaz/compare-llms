import { Seg } from './primitives';
import type { ViewMode, OverflowLevel } from './PreviewArea';

const VIEW_OPTIONS = ['1:1', 'HD', '9:16'] as const;

// Map between the user-facing label and the typed level.
const OVERFLOW_LABELS: Record<OverflowLevel, string> = {
  0: 'off',
  1: '1×',
  4: '4×',
  10: '10×',
};
const LABEL_TO_LEVEL: Record<string, OverflowLevel> = {
  off: 0, '1×': 1, '4×': 4, '10×': 10,
};
const OVERFLOW_OPTIONS = ['off', '1×', '4×', '10×'] as const;

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  overflow: OverflowLevel;
  onOverflowChange: (v: OverflowLevel) => void;
  label?: string;
}

export function PreviewBar({ view, onViewChange, overflow, onOverflowChange, label = 'preview' }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-3)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--c-text-4)', fontFamily: 'var(--font-mono)' }}>·</span>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
        view
      </span>
      <Seg<ViewMode> options={VIEW_OPTIONS} value={view} onChange={onViewChange} />
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
        overflow
      </span>
      <Seg
        options={OVERFLOW_OPTIONS}
        value={OVERFLOW_LABELS[overflow]}
        onChange={(v) => onOverflowChange(LABEL_TO_LEVEL[v])}
      />
    </div>
  );
}
