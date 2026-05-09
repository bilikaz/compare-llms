import type { ReactNode } from 'react';

export const ACCENT_BENCH = 'var(--c-accent-bench)';

// Last-session pointer in localStorage so we can rehydrate across reloads.
export const LAST_SESSION_KEY = 'compare-llms.lastBenchSessionId';

// Duration formatter shared across the bench UI. ms → "230ms", "5.2s",
// "1m12s". Tuned for the phase header / slot panes — anything sub-second
// stays in milliseconds, anything ≥1m gets the m/s split.
export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m${(s - m * 60).toFixed(0)}s`;
}

// Tiny mono uppercase column-header span used by the schedule preview, the
// per-c stats grid, and anywhere else we have an ad-hoc grid header row.
export function ColHead({ children, align }: { children: ReactNode; align?: 'right' }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--c-text-3)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        textAlign: align,
      }}
    >
      {children}
    </span>
  );
}
