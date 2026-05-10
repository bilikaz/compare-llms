// Run — middle of the bench data hierarchy.
//
// One parallel launch of N Tests at fixed concurrency. A Run is RUNTIME ONLY —
// it lives during streaming, holds the live LiveRun objects (which carry the
// transient charSamples used for the throughput chart and for computing the
// per-Run window stats), and at the end either:
//
//   * succeeds → produces a sealed { tests, summary } pair. Tests get
//     persisted to IDB by Bench. Summary (scalars only) is ingested by the
//     parent Batch's running totals. The Run object is then dropped along
//     with all its samples.
//   * fails    → returns null. Bench discards the Run and deletes any partial
//     test rows from IDB. No data leaks upward.
//
// No arrays ever cross the Run → Batch boundary. Batch sees only scalars.

import type { BenchRun, CharSample } from '../../types';
import { findTest, type Difficulty } from '../../tests';
import type { LiveRun } from '../runner';
import { Test } from './Test';
import type { Batch } from './Batch';
import type { Tier } from './Tier';

const SAMPLE_STEP_MS = 250;

// What a successful Run hands to its parent Batch. All scalars.
export interface RunSummary {
  c: number;               // concurrency = test count
  windowMs: number;        // duration of the strict c=N window
  windowChars: number;     // chars produced in that window
  peakChs: number;         // peak 1s aggregate ch/s in window
  minChs: number;          // min 1s aggregate ch/s in window (excl. zero ticks)
  doneCount: number;       // tests that finished (== c on success)
}

// Resources Run needs to apply itself to the rest of the world on finalize.
// Bench builds these as small accessor closures so Run never imports Bench
// (no upward dep) and Run can be unit-tested with stubs.
export interface FinalizeContext {
  batchFor:   (c: number) => Batch;
  tierFor:    (d: Difficulty) => Tier;
  // Initial IDB write for a freshly-finalized Test (one-shot per row).
  persist:    (t: Test) => Promise<void>;
  // Wires the Test's vote-context (tier ref + persist + notify). Called once
  // per finalized Test so subsequent t.vote() calls are self-sufficient.
  attachTest: (t: Test) => void;
}

export class Run {
  readonly id: string;
  readonly index: number;          // position in the Bench's run list
  readonly testIds: string[];
  readonly concurrency: number;

  // Persistent — populated on successful finalize(), stays around for review
  // and voting. Empty for runs that haven't fired yet, or that failed.
  tests: Test[];

  // Live state — only present during streaming, GC'd by clearLive() after
  // finalize() (whether success or failure).
  private liveTests: Map<number, LiveRun> = new Map();

  constructor(id: string, index: number, testIds: string[], tests: Test[] = []) {
    this.id = id;
    this.index = index;
    this.testIds = testIds.slice();
    this.concurrency = testIds.length;
    this.tests = tests;
  }

  isDone(): boolean {
    return this.tests.length === this.concurrency
      && this.tests.every((t) => t.isDone());
  }
  doneCount(): number { return this.tests.filter((t) => t.isDone()).length; }

  // ── Live-side API ────────────────────────────────────────────────────

  applyUpdate(live: LiveRun): void {
    this.liveTests.set(live.slotIndex, live);
  }

  liveSlots(): LiveRun[] {
    return Array.from(this.liveTests.values()).sort((a, b) => a.slotIndex - b.slotIndex);
  }

  // True when every slot has produced at least one char — i.e. we're past
  // prefill on every slot and momentarily at "real" c=N.
  isFullCapacity(): boolean {
    if (this.liveTests.size < this.concurrency) return false;
    for (const t of this.liveTests.values()) {
      if (t.output.length + t.thinking.length === 0) return false;
    }
    return true;
  }

  // Aggregate cumulative-chars time series for the live throughput chart.
  // Sums chars across slots at each 250ms tick. Empty until streaming starts.
  throughputSeries(): number[] {
    if (this.liveTests.size === 0) return [];
    const buckets = new Map<number, number>();
    for (const t of this.liveTests.values()) {
      for (const s of t.charSamples) {
        const tick = Math.floor(s.t / SAMPLE_STEP_MS);
        buckets.set(tick, (buckets.get(tick) ?? 0) + s.chars);
      }
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  // Called by Bench once the runner's Promise.all settles.
  //
  // On success: populates this.tests, persists each Test, ingests each Test
  // into its per-difficulty Tier, ingests the scalar RunSummary into the
  // per-c Batch — all in one place. Bench just provides the accessors.
  //
  // On failure: clears live state, leaves this.tests empty, and returns null
  // so Bench knows to leave the cursor pointing here for resume + clean up
  // the partial Test rows from IDB (it's the only one that still has refs).
  finalize(
    results: BenchRun[],
    liveResults: LiveRun[],
    ctx: FinalizeContext,
  ): RunSummary | null {
    // Snapshot live samples before we wipe — finalize uses them to compute
    // the window stats one last time.
    const samplesById = new Map<string, CharSample[]>();
    for (const lr of liveResults) samplesById.set(lr.id, lr.charSamples);
    this.liveTests.clear();

    const finished = results.filter((r) => r.status === 'done');
    if (finished.length !== this.concurrency) {
      this.tests = [];
      return null;
    }

    this.tests = finished
      .slice()
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .map((r) => new Test(r));
    const summary = computeSummary(finished, samplesById, this.concurrency);

    // Apply ourselves to the world — Bench owns the maps, we just call into
    // them via the context closures so this code stays in one place.
    for (const t of this.tests) {
      ctx.attachTest(t);                    // wires t.vote()/voteAll() ctx
      ctx.persist(t).catch(console.error);  // initial row write
      const def = findTest(t.testId);
      if (def) {
        const v = t.countVotes();
        ctx.tierFor(def.difficulty).ingestTest(t, v.checkCount, v.voted, v.passes);
      }
    }
    ctx.batchFor(summary.c).ingest(summary);
    return summary;
  }

  // Clear all stored Tests for this Run (used during resume — the Run's
  // about to be re-fired so any leftover Tests are stale).
  clearTests(): Test[] {
    const old = this.tests;
    this.tests = [];
    return old;
  }
}

function computeSummary(
  results: BenchRun[],
  samplesById: Map<string, CharSample[]>,
  concurrency: number,
): RunSummary {
  if (results.length === 0) {
    return zero(concurrency);
  }
  const batchStart = Math.min(...results.map((r) => r.startedAt));
  const firstFinishMs = Math.min(
    ...results.map((r) => r.startedAt + r.durationMs - batchStart),
  );

  const slots = results.map((r) => {
    const samples = samplesById.get(r.id) ?? [];
    const offset = r.startedAt - batchStart;
    const firstNonZero = samples.find((s) => s.chars > 0);
    const firstCharSlotT = firstNonZero ? firstNonZero.t : r.durationMs;
    return { offset, samples, allProducingAtMs: offset + firstCharSlotT };
  });

  const allProducingStartMs = Math.max(...slots.map((s) => s.allProducingAtMs));
  if (allProducingStartMs >= firstFinishMs) {
    return { c: concurrency, windowMs: 0, windowChars: 0, peakChs: 0, minChs: 0, doneCount: results.length };
  }
  const windowMs = firstFinishMs - allProducingStartMs;

  const charsAtT = (t: number): number => {
    let total = 0;
    for (const s of slots) {
      const slotT = t - s.offset;
      if (slotT <= 0) continue;
      let chars = 0;
      for (const sample of s.samples) {
        if (sample.t <= slotT) chars = sample.chars;
        else break;
      }
      total += chars;
    }
    return total;
  };

  const series: number[] = [charsAtT(allProducingStartMs)];
  for (let t = allProducingStartMs + SAMPLE_STEP_MS; t < firstFinishMs; t += SAMPLE_STEP_MS) {
    series.push(charsAtT(t));
  }
  const charsAtEnd = charsAtT(firstFinishMs);
  if (series[series.length - 1] !== charsAtEnd) series.push(charsAtEnd);

  const winSteps = Math.max(1, Math.round(1000 / SAMPLE_STEP_MS));
  let peakChs = 0;
  let minChs = Infinity;
  for (let i = 1; i < series.length; i++) {
    const j = Math.max(0, i - winSteps);
    const dt = ((i - j) * SAMPLE_STEP_MS) / 1000;
    if (dt <= 0) continue;
    const chs = (series[i] - series[j]) / dt;
    if (chs > peakChs) peakChs = chs;
    if (chs > 0 && chs < minChs) minChs = chs;
  }
  if (!isFinite(minChs)) minChs = 0;

  return {
    c: concurrency,
    windowMs,
    windowChars: Math.max(0, charsAtEnd - series[0]),
    peakChs,
    minChs,
    doneCount: results.length,
  };
}

function zero(c: number): RunSummary {
  return { c, windowMs: 0, windowChars: 0, peakChs: 0, minChs: 0, doneCount: 0 };
}
