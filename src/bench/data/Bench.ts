// Bench — top of the data hierarchy + the engine that drives the runner.
//
// State of truth:
//   * `runs`         one Run per scheduled launch. Each Run owns its Tests
//                    (populated on success; empty for unfired or failed).
//   * `cursor`       index into runs of the next-to-execute launch.
//   * `batches`      per-c Batch accumulators (running scalars only).
//   * `tiers`        per-difficulty Tier accumulators (sibling cut of Tests).
//   * Active Run = `runs[cursor]` while `isRunning()`.
//
// Failed Runs leave Run.tests empty (their Test rows are deleted from IDB).
// Successful Runs hand a scalar summary to the per-c Batch and let each
// Test's per-difficulty Tier ingest it. Live samples (charSamples) only
// exist on the runner-side LiveRun objects and never enter the persisted
// shape — see runner.ts persistFromLive() and Run.finalize().
//
// Subscribers (React) are notified on any mutation. Persistence (BenchSession
// + per-Test BenchRun rows) is handled here, never by lower layers.

import type {
  BenchRun,
  BenchSession,
  BenchSessionStatus,
  ModelConfig,
} from '../../types';
import {
  putBenchSession,
  putBenchRun,
  deleteBenchRun,
  getBenchSession,
  getBenchRunsBySession,
} from '../../db';
import { makeSession, type BuiltSchedule } from '../schedule';
import { runSession, type LiveRun, type SlotControl } from '../runner';
import { type Difficulty } from '../../tests';
import { Test } from './Test';
import { Run } from './Run';
import { Batch } from './Batch';
import { Tier } from './Tier';

export class Bench {
  readonly id: string;
  readonly modelConfig: ModelConfig;
  readonly scheduleId: string;
  readonly scheduleLabel: string;
  readonly startedAt: number;

  status: BenchSessionStatus;
  completedAt?: number;
  cursor: number;

  // Source of truth: one Run per scheduled launch.
  runs: Run[];

  // Per-c Batch accumulators. Built up as Runs finish; persisted as scalars
  // on the BenchSession row.
  batches: Map<number, Batch>;

  // Per-tier accumulators. Sibling cut of the same Tests — a Run may carry
  // mixed-tier Tests (custom schedules), so Tier is keyed off each Test's
  // own `findTest(testId).difficulty`, not off the Run as a whole.
  tiers: Map<Difficulty, Tier>;

  // Live state — only set during execution. While a launch is in-flight,
  // `runs[cursor]` is the active Run and its applyUpdate() carries the
  // streaming LiveRun snapshots.
  private slotControls: Map<number, SlotControl> = new Map();
  private abortCtrl: AbortController | null = null;
  private listeners: Set<() => void> = new Set();

  private constructor(s: BenchSession, runs: Run[]) {
    this.id = s.id;
    this.modelConfig = s.modelConfig;
    this.scheduleId = s.scheduleId;
    this.scheduleLabel = s.scheduleLabel;
    this.startedAt = s.startedAt;
    this.status = s.status;
    this.completedAt = s.completedAt;
    this.cursor = s.currentBatchIndex;
    this.runs = runs;
    this.batches = new Map();
    for (const t of s.batchTotals ?? []) {
      this.batches.set(t.c, new Batch(t.c, t));
    }
    this.tiers = new Map();
    for (const t of s.tierTotals ?? []) {
      this.tiers.set(t.tier, new Tier(t.tier, t));
    }
  }

  // ── Tier helpers ──────────────────────────────────────────────────────

  // Tier lookup with on-the-fly creation — Bench is the only allocator so
  // sibling code can rely on the map having an entry once a Test of that
  // tier has landed.
  private tierFor(d: Difficulty): Tier {
    let t = this.tiers.get(d);
    if (!t) { t = new Tier(d); this.tiers.set(d, t); }
    return t;
  }

  // Same idea for Batch — exposed so Run.finalize can ingest its summary.
  private batchFor(c: number): Batch {
    let b = this.batches.get(c);
    if (!b) { b = new Batch(c); this.batches.set(c, b); }
    return b;
  }

  // Wire a Test's vote context so t.vote()/voteAll() can rebump its tier,
  // persist itself, and notify subscribers without holding a back-ref to Bench.
  // Called from Run.finalize (post-success) and Bench.load (after hydration).
  private attachTest(t: Test, runIndex: number): void {
    t.attachCtx({
      tier: this.tierFor(t.tier()),
      persist: () => this.persistTest(t, runIndex).then(() => this.persistMeta()),
      notify: () => this.notify(),
    });
  }

  // ── Factories ─────────────────────────────────────────────────────────
  static async create(model: ModelConfig, schedule: BuiltSchedule): Promise<Bench> {
    const s = makeSession(model, schedule);
    s.batchTotals = [];
    s.tierTotals = [];
    await putBenchSession(s);
    const runs = s.batches.map((b) => new Run(b.id, b.index, b.tests));
    return new Bench(s, runs);
  }

  static async load(id: string): Promise<Bench | null> {
    const s = await getBenchSession(id);
    if (!s) return null;

    // Self-heal IDB: any not-done test row left over from a previous stop
    // is partial garbage — drop it. Stats can't be reconstructed from
    // samples (we don't store them anymore), so partials add no value.
    const rows = await getBenchRunsBySession(id);
    const partials = rows.filter((r) => r.status !== 'done');
    await Promise.all(partials.map((r) => deleteBenchRun(r.id).catch(() => {})));
    const finished = rows.filter((r) => r.status === 'done');

    // Group finished tests by their parent Run id (= persisted batchId).
    const byRunId = new Map<string, Test[]>();
    for (const row of finished) {
      const arr = byRunId.get(row.batchId) ?? [];
      arr.push(new Test(row));
      byRunId.set(row.batchId, arr);
    }

    const runs = s.batches.map((b) => {
      const tests = (byRunId.get(b.id) ?? []).sort((a, b2) => a.slotIndex - b2.slotIndex);
      return new Run(b.id, b.index, b.tests, tests);
    });

    const bench = new Bench(s, runs);
    // Wire each hydrated Test's vote-context so RubricPanel votes work
    // immediately after load (no first-finalize gate).
    for (const r of runs) for (const t of r.tests) bench.attachTest(t, r.index);
    // Self-heal cursor: trust the runs' actual completion, not whatever
    // bookkeeping was on disk.
    bench.cursor = bench.deriveCursor();
    if (bench.cursor !== s.currentBatchIndex) await bench.persistMeta();
    return bench;
  }

  // ── Derivations ───────────────────────────────────────────────────────

  // First Run that isn't fully done — the next launch to fire.
  private deriveCursor(): number {
    for (let i = 0; i < this.runs.length; i++) {
      if (!this.runs[i].isDone()) return i;
    }
    return this.runs.length;
  }

  // Convenience getter — flat list of every persisted Test, ordered by
  // (Run index, slot). Doesn't allocate any new Test objects.
  allTests(): Test[] { return this.runs.flatMap((r) => r.tests); }

  totalSlots(): number {
    return this.runs.reduce((n, r) => n + r.concurrency, 0);
  }
  doneSlots(): number {
    return this.runs.reduce((n, r) => n + r.tests.length, 0);
  }

  isComplete(): boolean { return this.cursor >= this.runs.length; }
  isResumable(): boolean { return !this.isRunning() && !this.isComplete(); }
  isRunning(): boolean { return this.abortCtrl !== null; }

  currentRun(): Run | null { return this.runs[this.cursor] ?? null; }

  // Phase descriptor for PhaseHeader. Null once cursor passes the last Run.
  phaseInfo(): { c: number; batchIndex: number; total: number } | null {
    const r = this.currentRun();
    if (!r) return null;
    return { c: r.concurrency, batchIndex: r.index, total: this.runs.length };
  }

  // Per-c Batches in ascending order (PerCStatsCard input).
  batchList(): Batch[] {
    return Array.from(this.batches.values()).sort((a, b) => a.c - b.c);
  }

  // Tiers in canonical difficulty order (RatingSummary input).
  tierList(): Tier[] {
    const order: Difficulty[] = ['easy', 'medium', 'hard', 'boss'];
    return order
      .map((d) => this.tiers.get(d))
      .filter((t): t is Tier => !!t);
  }

  liveSlots(): LiveRun[] { return this.currentRun()?.liveSlots() ?? []; }
  liveThroughput(): number[] { return this.currentRun()?.throughputSeries() ?? []; }

  // ── Projections for legacy children ──────────────────────────────────
  benchRunRows(): BenchRun[] {
    return this.runs.flatMap((run) =>
      run.tests.map((t) => {
        const row = t.toPersisted();
        row.sessionId = this.id;
        row.batchIndex = run.index;
        return row;
      }),
    );
  }

  toBenchSession(): BenchSession {
    return this.toPersistedSession();
  }

  // ── Subscribe ────────────────────────────────────────────────────────
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private notify(): void { for (const fn of this.listeners) fn(); }

  // ── Persistence helpers ──────────────────────────────────────────────
  private toPersistedSession(): BenchSession {
    return {
      id: this.id,
      modelConfig: this.modelConfig,
      scheduleId: this.scheduleId,
      scheduleLabel: this.scheduleLabel,
      batches: this.runs.map((r) => ({ id: r.id, index: r.index, tests: r.testIds })),
      startedAt: this.startedAt,
      status: this.status,
      currentBatchIndex: this.cursor,
      completedAt: this.completedAt,
      batchTotals: Array.from(this.batches.values()).map((b) => b.toJSON()),
      tierTotals: Array.from(this.tiers.values()).map((t) => t.toJSON()),
    };
  }
  private async persistMeta(): Promise<void> {
    await putBenchSession(this.toPersistedSession());
  }
  private async persistTest(t: Test, runIndex: number): Promise<void> {
    const row = t.toPersisted();
    row.sessionId = this.id;
    row.batchIndex = runIndex;
    await putBenchRun(row);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  async run(): Promise<void> {
    if (this.isRunning()) return;
    this.status = 'running';
    await this.persistMeta();
    this.notify();

    const ctrl = new AbortController();
    this.abortCtrl = ctrl;
    this.notify();

    try {
      await runSession({
        session: this.toPersistedSession(),
        signal: ctrl.signal,
        onBatchStart: (batch) => {
          this.slotControls.clear();
          this.cursor = batch.index;
          // Reset the active Run's tests in case we're retrying.
          const r = this.runs[batch.index];
          if (r) r.tests = [];
          this.notify();
        },
        onBatchEnd: (batch, results) => {
          this.slotControls.clear();
          const run = this.runs[batch.index];
          if (!run) return;

          // Run.finalize handles its own world-application: persists each
          // Test, ingests into Tier per test, ingests its summary into Batch.
          // Bench just provides the accessors + handles the failure cleanup
          // (which Run can't do — runner persisted the partial rows already).
          const summary = run.finalize(results, run.liveSlots(), {
            batchFor:   (c) => this.batchFor(c),
            tierFor:    (d) => this.tierFor(d),
            persist:    (t) => this.persistTest(t, batch.index),
            attachTest: (t) => this.attachTest(t, batch.index),
          });

          if (!summary) {
            // Failure: drop everything for this launch from IDB.
            for (const r of results) deleteBenchRun(r.id).catch(console.error);
          }
          this.cursor = this.deriveCursor();
          this.notify();
        },
        onUpdate: (live) => {
          this.currentRun()?.applyUpdate(live);
          this.notify();
        },
        onSlotControl: (slotIndex, control) => {
          this.slotControls.set(slotIndex, control);
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.abortCtrl = null;
      this.cursor = this.deriveCursor();
      this.status = this.isComplete() ? 'completed' : 'aborted';
      // Stamp the end time on BOTH outcomes so PastSessionsList can show a
      // duration for aborted sessions too (otherwise stopped runs read
      // "duration —" forever even though they clearly ran for some time).
      if (!this.completedAt) this.completedAt = Date.now();
      await this.persistMeta();
      this.notify();
    }
  }

  stop(): void { this.abortCtrl?.abort(); }

  async resume(): Promise<void> {
    if (this.isRunning() || this.isComplete()) return;
    // Clear the end-time stamp from the previous stop so the next finish
    // (whether completion or another stop) records the new one.
    this.completedAt = undefined;
    // Wipe leftover Tests for the current Run + un-ingest from Tier.
    const run = this.currentRun();
    if (run && run.tests.length > 0) {
      for (const t of run.tests) {
        const v = t.countVotes();
        const tier = this.tierFor(t.tier());
        tier.rebumpVote(
          { voted: v.voted, passes: v.passes },
          { voted: 0, passes: 0 },
          v.checkCount,
        );
        tier.doneTestCount -= 1;
        tier.totalChecks -= v.checkCount;
        tier.sumDurationMs -= t.durationMs;
      }
      const stale = run.clearTests();
      await Promise.all(stale.map((t) => deleteBenchRun(t.id).catch(() => {})));
      this.notify();
    }
    await this.run();
  }

  async restartSlot(slotIndex: number): Promise<void> {
    const ctrl = this.slotControls.get(slotIndex);
    if (!ctrl) return;
    this.notify();
    await ctrl.restart();
  }

}
