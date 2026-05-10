import type { BenchBatch, BenchRun, BenchSession, CharSample, StreamUsage } from '../types';
import { findTest } from '../tests';
import { streamModel } from '../providers';
import { putBenchRun, putBenchSession, deleteBenchRun } from '../db';

// Sampling cadence for character throughput. 250ms is a good compromise between
// resolution (4 samples/sec → 1s window resolves to ~4 ticks) and bookkeeping
// volume (a 2-minute run gives ~480 samples; tens-of-MB indexed-db budget covers
// thousands of runs).
const SAMPLE_INTERVAL_MS = 250;

// Returns avg + peak chars/sec from a samples array.
// peak = max delta over a 1-second sliding window (4 ticks @ 250ms).
export function deriveChsMetrics(samples: CharSample[], totalDurationMs: number): { avgChs: number; peakChs: number } {
  if (!samples.length) return { avgChs: 0, peakChs: 0 };
  const last = samples[samples.length - 1];
  const sec = totalDurationMs / 1000;
  const avgChs = sec > 0 ? last.chars / sec : 0;
  // 1s sliding window: for each i, find the earliest j with samples[j].t >= samples[i].t - 1000
  let peakChs = 0;
  let j = 0;
  for (let i = 0; i < samples.length; i++) {
    while (j < i && samples[i].t - samples[j].t > 1000) j++;
    const dt = (samples[i].t - samples[j].t) / 1000;
    if (dt > 0) {
      const dchars = samples[i].chars - samples[j].chars;
      const chs = dchars / dt;
      if (chs > peakChs) peakChs = chs;
    }
  }
  return { avgChs, peakChs };
}

// Live "view model" of an active run, surfaced to the UI while streaming.
// The runner mutates this object; callers read it via the `onUpdate` callback.
//
// `charSamples` and `peakChs` are LIVE-ONLY — kept here for the live throughput
// chart and for the once-per-run window-stats computation. They're dropped at
// persistence time (see persistFromLive() which projects to BenchRun without
// these fields).
export interface LiveRun extends BenchRun {
  charSamples: CharSample[];
  peakChs: number;
}

// Project a LiveRun down to the persisted BenchRun shape — strips the
// transient sampling array and the per-test peak (the cluster-level peak
// is captured per-Batch via Run.summary on completion).
export function persistFromLive(live: LiveRun): BenchRun {
  return {
    id: live.id,
    sessionId: live.sessionId,
    batchId: live.batchId,
    batchIndex: live.batchIndex,
    slotIndex: live.slotIndex,
    concurrency: live.concurrency,
    testId: live.testId,
    prompt: live.prompt,
    startedAt: live.startedAt,
    status: live.status,
    output: live.output,
    thinking: live.thinking,
    usage: live.usage,
    durationMs: live.durationMs,
    error: live.error,
    avgChs: live.avgChs,
    rubricVotes: live.rubricVotes,
    ratedAt: live.ratedAt,
  };
}

// Per-slot control surface exposed to the orchestrator so it can render a
// "restart" button on a stuck slot (e.g. one that's looping in <thinking>
// for 20m+) without having to abort the whole session.
export interface SlotControl {
  // Abort the slot's current stream, delete its persisted partial record,
  // and spawn a fresh attempt for the same test in the same slot index.
  // No-op once the parent session signal has been aborted.
  restart: () => Promise<void>;
}

export interface RunBatchOptions {
  session: BenchSession;
  batch: BenchBatch;
  signal: AbortSignal;
  // Called whenever a slot's LiveRun mutates (delta, status change, sample).
  // Cheap React-friendly: the runner mutates the same object across calls,
  // so consumers should treat updates as identity-stable and rerender themselves.
  onUpdate?: (run: LiveRun) => void;
  // Called once per slot when the slot starts AND every time it's restarted,
  // so the orchestrator can keep its slotIndex→SlotControl map fresh.
  onSlotControl?: (slotIndex: number, ctrl: SlotControl) => void;
}

// Run a single slot — streams the model, accumulates text/thinking, samples
// chars, persists at completion. Returns the finalized run.
async function runSlot(
  session: BenchSession,
  batch: BenchBatch,
  slotIndex: number,
  signal: AbortSignal,
  onUpdate?: (run: LiveRun) => void,
): Promise<BenchRun> {
  const testId = batch.tests[slotIndex];
  const test = findTest(testId);
  if (!test) throw new Error(`Unknown test id: ${testId}`);

  const startWall = Date.now();
  const startMono = performance.now();
  const run: LiveRun = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    batchId: batch.id,
    batchIndex: batch.index,
    slotIndex,
    concurrency: batch.tests.length,
    testId,
    prompt: test.prompt,
    startedAt: startWall,
    status: 'streaming',
    output: '',
    thinking: '',
    usage: {},
    durationMs: 0,
    charSamples: [],
    avgChs: 0,
    peakChs: 0,
  };
  onUpdate?.(run);

  // Sampling timer — fires every SAMPLE_INTERVAL_MS, snapshots chars-so-far.
  const sampler = setInterval(() => {
    const t = Math.round(performance.now() - startMono);
    run.charSamples.push({ t, chars: run.output.length + run.thinking.length });
    onUpdate?.(run);
  }, SAMPLE_INTERVAL_MS);

  try {
    let usage: StreamUsage = {};
    for await (const evt of streamModel(session.modelConfig, test.prompt, signal)) {
      if (evt.type === 'text') {
        run.output += evt.delta;
        onUpdate?.(run);
      } else if (evt.type === 'thinking') {
        run.thinking += evt.delta;
        onUpdate?.(run);
      } else if (evt.type === 'usage') {
        usage = { ...usage, ...evt.usage };
        run.usage = usage;
        onUpdate?.(run);
      } else if (evt.type === 'error') {
        run.error = evt.message;
      }
    }
    if (signal.aborted) {
      run.status = 'aborted';
    } else if (run.error) {
      run.status = 'error';
    } else {
      run.status = 'done';
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (signal.aborted) {
      run.status = 'aborted';
    } else {
      run.status = 'error';
      run.error = msg;
    }
  } finally {
    clearInterval(sampler);
  }

  run.durationMs = Math.round(performance.now() - startMono);
  // Final sample so derived metrics reflect total chars at completion.
  run.charSamples.push({ t: run.durationMs, chars: run.output.length + run.thinking.length });
  const { avgChs, peakChs } = deriveChsMetrics(run.charSamples, run.durationMs);
  run.avgChs = avgChs;
  run.peakChs = peakChs;
  onUpdate?.(run);
  // Persist the lean BenchRun shape — drop the transient sample array.
  await putBenchRun(persistFromLive(run));
  return run;
}

// Run all slots in a batch concurrently. Resolves with all runs (ok or error).
//
// Each slot gets its own AbortController, chained off the parent session
// signal so a session-level stop still kills everything. The orchestrator
// can also kill+respawn an individual slot via the SlotControl handed out
// in onSlotControl — handy when one slot loops in <thinking> and would
// otherwise stall the whole batch's Promise.all.
export async function runBatch(opts: RunBatchOptions): Promise<BenchRun[]> {
  const { session, batch, signal, onUpdate, onSlotControl } = opts;
  const slotPromises: Promise<BenchRun>[] = [];

  function startSlot(slotIndex: number) {
    if (signal.aborted) return;
    const ctrl = new AbortController();
    const onParentAbort = () => ctrl.abort();
    signal.addEventListener('abort', onParentAbort);

    const promise = runSlot(session, batch, slotIndex, ctrl.signal, onUpdate)
      .finally(() => signal.removeEventListener('abort', onParentAbort));
    slotPromises[slotIndex] = promise;

    onSlotControl?.(slotIndex, {
      restart: async () => {
        if (signal.aborted) return;
        ctrl.abort();
        // Wait for the aborted attempt to fully settle, then drop its
        // partial record so the upcoming retry is the only one persisted
        // for this (batchId, slotIndex) — keeps aggregateByC's per-batch
        // window math single-attempt clean.
        const oldRun = await promise.catch(() => null);
        if (oldRun) {
          try { await deleteBenchRun(oldRun.id); } catch (e) { console.error(e); }
        }
        startSlot(slotIndex);
      },
    });
  }

  for (let i = 0; i < batch.tests.length; i++) startSlot(i);

  // Wait for all slots; if any was restarted while we were waiting (i.e. a
  // promise in `slotPromises` got replaced), loop and wait for the new one
  // too. Stable when no further restarts happen.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = slotPromises.slice();
    await Promise.allSettled(snapshot);
    if (snapshot.every((p, i) => p === slotPromises[i])) break;
  }

  return Promise.all(slotPromises);
}

export interface RunSessionOptions {
  session: BenchSession;
  signal: AbortSignal;
  onBatchStart?: (batch: BenchBatch) => void;
  onBatchEnd?: (batch: BenchBatch, runs: BenchRun[]) => void;
  onUpdate?: (run: LiveRun) => void;
  onSlotControl?: (slotIndex: number, ctrl: SlotControl) => void;
}

// Walk the session's batches sequentially. Each call to runBatch returns once
// all slots in that batch settle. Persists session status changes between batches.
export async function runSession(opts: RunSessionOptions): Promise<void> {
  const { session, signal, onBatchStart, onBatchEnd, onUpdate, onSlotControl } = opts;
  session.status = 'running';
  await putBenchSession(session);

  for (let i = session.currentBatchIndex; i < session.batches.length; i++) {
    if (signal.aborted) break;
    const batch = session.batches[i];
    session.currentBatchIndex = i;
    await putBenchSession(session);
    onBatchStart?.(batch);

    const runs = await runBatch({ session, batch, signal, onUpdate, onSlotControl });
    onBatchEnd?.(batch, runs);

    // If the batch had any aborted runs (user pressed stop mid-batch), DON'T
    // advance currentBatchIndex — leave it pointing at this stuck batch so a
    // subsequent resume retries it from scratch. The orchestrator drops the
    // aborted runs (and the resume path also clears any leftover done runs
    // from this batch before re-firing) so retry stays clean.
    const hasAborted = runs.some((r) => r.status === 'aborted');
    if (hasAborted) {
      await putBenchSession(session);
      break;
    }
    session.currentBatchIndex = i + 1;
    await putBenchSession(session);
  }

  if (signal.aborted) {
    session.status = 'aborted';
  } else {
    session.status = 'completed';
    session.completedAt = Date.now();
  }
  await putBenchSession(session);
}

// (Per-c aggregation moved to Bench / Batch — Batch.ingest() accumulates
// scalars from each Run.summary and PerCStatsCard reads them directly. The
// old aggregateByC() walked persisted charSamples, which we no longer keep.)
