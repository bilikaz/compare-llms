// Batch — c-level group of completed Runs.
//
// Storage-efficient by design: only keeps running scalars. As each Run
// finishes successfully it hands a RunSummary up; Batch sums / max'es /
// min's it into the totals. No per-Run arrays, no per-tick samples — Batch
// can rehydrate from `BatchTotals` on bench load and never recompute from
// raw data (which we threw away on purpose to avoid blowing memory).

import type { BatchTotals } from '../../types';
import type { RunSummary } from './Run';

export class Batch {
  readonly c: number;

  // Accumulators. minChs uses 0 to mean "no data yet" externally.
  sumWindowMs: number;
  sumWindowChars: number;
  runCount: number;
  peakChs: number;
  minChs: number;
  doneTestCount: number;

  constructor(c: number, totals?: BatchTotals) {
    this.c = c;
    this.sumWindowMs = totals?.sumWindowMs ?? 0;
    this.sumWindowChars = totals?.sumWindowChars ?? 0;
    this.runCount = totals?.runCount ?? 0;
    this.peakChs = totals?.peakChs ?? 0;
    this.minChs = totals?.minChs ?? 0;
    this.doneTestCount = totals?.doneTestCount ?? 0;
  }

  ingest(s: RunSummary): void {
    if (s.windowMs > 0) {
      this.sumWindowMs += s.windowMs;
      this.sumWindowChars += s.windowChars;
      if (s.peakChs > this.peakChs) this.peakChs = s.peakChs;
      if (s.minChs > 0) {
        if (this.minChs === 0 || s.minChs < this.minChs) this.minChs = s.minChs;
      }
    }
    this.runCount += 1;
    this.doneTestCount += s.doneCount;
  }

  // Derived — cheap divisions, no arrays.
  avgChs(): number {
    return this.sumWindowMs > 0 ? this.sumWindowChars / (this.sumWindowMs / 1000) : 0;
  }

  // Persistable form for BenchSession.batchTotals.
  toJSON(): BatchTotals {
    return {
      c: this.c,
      sumWindowMs: this.sumWindowMs,
      sumWindowChars: this.sumWindowChars,
      runCount: this.runCount,
      peakChs: this.peakChs,
      minChs: this.minChs,
      doneTestCount: this.doneTestCount,
    };
  }
}
