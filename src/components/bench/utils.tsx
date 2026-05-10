import type { ReactNode } from 'react';
import type { BenchRun, MetricUnit } from '../../types';
import type { LiveRun } from '../../bench/runner';

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

// ── Run metric formatting ────────────────────────────────────────────────
// Mirrors the Compare-side `metricsFor` shape so the two modes display the
// same metric row: `chars: N (M 💡)  X ch/s` (or tokens variant).
//
// Works for both completed BenchRuns and in-flight LiveRuns:
//   - elapsed comes from durationMs once set; otherwise from the latest
//     250ms char-sample timestamp.
//   - throughput uses the cached avgChs once set; otherwise re-derives it
//     from totalChars / elapsedSeconds so the row updates while streaming.

export interface RunMetrics {
  time: string;
  chars: string;
  tokens: string;
  chs: string;
  toks: string;
  thinkBracket?: string; // bracketed thinking-only count for `(N 💡)` suffix
}

export function metricsForRun(run: BenchRun | LiveRun, unit: MetricUnit): RunMetrics {
  const totalChars = run.output.length + run.thinking.length;
  // charSamples only exists on the LIVE shape (LiveRun) — persisted BenchRun
  // doesn't carry them anymore. While streaming we still get the latest tick
  // for elapsed; for finished runs durationMs is set so the fallback isn't used.
  const live = run as Partial<LiveRun>;
  const lastSampleMs = live.charSamples?.at(-1)?.t ?? 0;
  const elapsedMs = run.durationMs > 0 ? run.durationMs : lastSampleMs;
  const sec = elapsedMs / 1000;

  const realTokens = (run.usage.outputTokens ?? 0) + (run.usage.thinkingTokens ?? 0);
  const tokensTotal = realTokens > 0 ? realTokens : Math.round(totalChars / 4);
  const tokensEstimated = realTokens === 0;

  const liveChs = run.avgChs > 0 ? run.avgChs : (sec > 0 ? totalChars / sec : 0);

  let thinkBracket: string | undefined;
  if (run.thinking.length > 0) {
    if (unit === 'chars') {
      thinkBracket = run.thinking.length.toLocaleString();
    } else {
      const realThink = run.usage.thinkingTokens;
      thinkBracket = realThink != null && realThink > 0
        ? realThink.toLocaleString()
        : `~${Math.round(run.thinking.length / 4).toLocaleString()}`;
    }
  }

  return {
    time: fmtDuration(elapsedMs),
    chars: totalChars > 0 ? totalChars.toLocaleString() : '—',
    tokens: tokensTotal > 0
      ? `${tokensEstimated ? '~' : ''}${tokensTotal.toLocaleString()}`
      : '—',
    chs: liveChs > 0 ? liveChs.toFixed(0) : '—',
    toks: liveChs > 0 ? `~${(liveChs / 4).toFixed(0)}` : '—',
    thinkBracket,
  };
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
