import type { Round } from '../../types';
import { TESTS } from '../../tests';

export const ACCENT_A = 'var(--c-accent-a)';
export const ACCENT_B = 'var(--c-accent-b)';

// Compact "12.3k" / "847" formatter. Used in the session summary card for
// totals that span a wide range — most rounds produce a few thousand chars,
// but a long benchmark run can hit 6 figures.
export function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// Per-side aggregate. Output and thinking are kept separate so the summary
// can show "5.4k +1.8k 💡" — making it obvious which model burned tokens on
// reasoning vs final output.
export interface SideStats {
  outChars: number;
  thinkChars: number;
  outTokens: number;
  thinkTokens: number;
  // True when the provider didn't report real token usage and the count above
  // is estimated as chars÷4. Output and thinking are estimated independently:
  // some providers report output tokens but not thinking (or vice versa).
  outTokensEstimated: boolean;
  thinkTokensEstimated: boolean;
  // ch/s computed across all chars (out + thinking) divided by total stream
  // duration on this side — the same number a viewer would see on the panel.
  chs: number;
  sec: number;
}

// Aggregate session stats across all rounds. Only fully-rated rounds (every
// rubric check voted on both sides) contribute to the rubric averages — half-
// rated rounds would skew the percentage. Char / token / time stats are kept
// as per-side pairs since the comparison is the interesting signal — totals
// across both sides aren't meaningful when models stream concurrently.
export interface Summary {
  totalRounds: number;
  ratedRounds: number;
  aPct: number;
  bPct: number;
  a: SideStats;
  b: SideStats;
  winner: 'A' | 'B' | null;
}

interface SideAccum {
  outChars: number;
  thinkChars: number;
  outRealTokens: number;
  thinkRealTokens: number;
  // Did any round on this side report real output / thinking token counts?
  // If not, the corresponding total stays estimated.
  outReal: boolean;
  thinkReal: boolean;
  durMs: number;
}
const emptyAccum = (): SideAccum => ({
  outChars: 0, thinkChars: 0,
  outRealTokens: 0, thinkRealTokens: 0,
  outReal: false, thinkReal: false,
  durMs: 0,
});

function finalize(s: SideAccum): SideStats {
  return {
    outChars: s.outChars,
    thinkChars: s.thinkChars,
    outTokens: s.outReal ? s.outRealTokens : Math.round(s.outChars / 4),
    thinkTokens: s.thinkReal ? s.thinkRealTokens : Math.round(s.thinkChars / 4),
    outTokensEstimated: !s.outReal,
    thinkTokensEstimated: !s.thinkReal,
    chs: s.durMs > 0 ? Math.round((s.outChars + s.thinkChars) / (s.durMs / 1000)) : 0,
    sec: s.durMs / 1000,
  };
}

export function computeSummary(rounds: Round[]): Summary | null {
  if (!rounds.length) return null;
  let aPctSum = 0, bPctSum = 0, ratedRounds = 0;
  const a = emptyAccum();
  const b = emptyAccum();

  for (const r of rounds) {
    const t = TESTS.find((x) => x.id === r.testId);
    const checks = t?.rubric;
    if (checks?.length) {
      const aRated = checks.every((c) => r.resultA.rubricVotes?.[c.id]);
      const bRated = checks.every((c) => r.resultB.rubricVotes?.[c.id]);
      if (aRated && bRated) {
        ratedRounds++;
        aPctSum += checks.filter((c) => r.resultA.rubricVotes?.[c.id] === 'pass').length / checks.length * 100;
        bPctSum += checks.filter((c) => r.resultB.rubricVotes?.[c.id] === 'pass').length / checks.length * 100;
      }
    } else if (r.resultA.rating != null && r.resultB.rating != null) {
      // Custom prompts — fold the 1–10 rating into the same percentage
      // average as preset rubrics. A rating of 7/10 = 70%, directly
      // comparable to a 9/13 rubric (~69%).
      ratedRounds++;
      aPctSum += r.resultA.rating * 10;
      bPctSum += r.resultB.rating * 10;
    }
    a.outChars += r.resultA.charCount;
    a.thinkChars += r.resultA.thinkingCharCount;
    a.durMs += r.resultA.durationMs;
    if (r.resultA.usage.outputTokens != null) {
      a.outRealTokens += r.resultA.usage.outputTokens;
      a.outReal = true;
    }
    if (r.resultA.usage.thinkingTokens != null) {
      a.thinkRealTokens += r.resultA.usage.thinkingTokens;
      a.thinkReal = true;
    }

    b.outChars += r.resultB.charCount;
    b.thinkChars += r.resultB.thinkingCharCount;
    b.durMs += r.resultB.durationMs;
    if (r.resultB.usage.outputTokens != null) {
      b.outRealTokens += r.resultB.usage.outputTokens;
      b.outReal = true;
    }
    if (r.resultB.usage.thinkingTokens != null) {
      b.thinkRealTokens += r.resultB.usage.thinkingTokens;
      b.thinkReal = true;
    }
  }

  const aPct = ratedRounds ? Math.round(aPctSum / ratedRounds) : 0;
  const bPct = ratedRounds ? Math.round(bPctSum / ratedRounds) : 0;
  return {
    totalRounds: rounds.length,
    ratedRounds,
    aPct,
    bPct,
    a: finalize(a),
    b: finalize(b),
    winner: ratedRounds === 0 ? null : aPct === bPct ? null : aPct > bPct ? 'A' : 'B',
  };
}
