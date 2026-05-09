import type { BenchBatch, BenchRun, BenchSession, CharSample, StreamUsage } from '../types';
import { findTest } from '../tests';
import { streamModel } from '../providers';
import { putBenchRun, putBenchSession } from '../db';

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
export interface LiveRun extends BenchRun {
  // Carries the most-recent text/thinking deltas for live UI rendering. The
  // BenchRun base fields hold the cumulative output, which is what gets persisted.
  // (No extra fields right now; kept as a separate interface so we can grow it
  // without bumping the persisted shape.)
}

export interface RunBatchOptions {
  session: BenchSession;
  batch: BenchBatch;
  signal: AbortSignal;
  // Called whenever a slot's LiveRun mutates (delta, status change, sample).
  // Cheap React-friendly: the runner mutates the same object across calls,
  // so consumers should treat updates as identity-stable and rerender themselves.
  onUpdate?: (run: LiveRun) => void;
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
  await putBenchRun(run);
  return run;
}

// Run all slots in a batch concurrently. Resolves with all runs (ok or error).
export async function runBatch(opts: RunBatchOptions): Promise<BenchRun[]> {
  const { session, batch, signal, onUpdate } = opts;
  const promises = batch.tests.map((_, slotIndex) =>
    runSlot(session, batch, slotIndex, signal, onUpdate),
  );
  return Promise.all(promises);
}

export interface RunSessionOptions {
  session: BenchSession;
  signal: AbortSignal;
  onBatchStart?: (batch: BenchBatch) => void;
  onBatchEnd?: (batch: BenchBatch, runs: BenchRun[]) => void;
  onUpdate?: (run: LiveRun) => void;
}

// Walk the session's batches sequentially. Each call to runBatch returns once
// all slots in that batch settle. Persists session status changes between batches.
export async function runSession(opts: RunSessionOptions): Promise<void> {
  const { session, signal, onBatchStart, onBatchEnd, onUpdate } = opts;
  session.status = 'running';
  await putBenchSession(session);

  for (let i = session.currentBatchIndex; i < session.batches.length; i++) {
    if (signal.aborted) break;
    const batch = session.batches[i];
    session.currentBatchIndex = i;
    await putBenchSession(session);
    onBatchStart?.(batch);

    const runs = await runBatch({ session, batch, signal, onUpdate });
    onBatchEnd?.(batch, runs);

    // Mark the batch advanced. After the loop we'll either finish or be aborted.
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

// Aggregate metrics across multiple runs at a given concurrency level.
// Used by the per-c stats card.
export interface PerCAggregate {
  c: number;
  totalRuns: number;
  completedRuns: number;
  totalDurationMs: number;     // sum of all runs' durations at this c
  wallClockMs: number;          // earliest startedAt → latest end across batches at this c
  totalChars: number;
  avgChs: number;               // totalChars / wallClockSec
  peakChs: number;              // max peakChs across runs at this c
}

export function aggregateByC(runs: BenchRun[]): PerCAggregate[] {
  const groups = new Map<number, BenchRun[]>();
  for (const r of runs) {
    const arr = groups.get(r.concurrency) ?? [];
    arr.push(r);
    groups.set(r.concurrency, arr);
  }
  const out: PerCAggregate[] = [];
  for (const [c, list] of groups) {
    const completed = list.filter((r) => r.status === 'done');
    const totalChars = completed.reduce((s, r) => s + r.output.length + r.thinking.length, 0);
    const totalDuration = completed.reduce((s, r) => s + r.durationMs, 0);
    const wallStart = list.length ? Math.min(...list.map((r) => r.startedAt)) : 0;
    const wallEnd = list.length ? Math.max(...list.map((r) => r.startedAt + r.durationMs)) : 0;
    const wallClockMs = Math.max(0, wallEnd - wallStart);
    const wallSec = wallClockMs / 1000;
    out.push({
      c,
      totalRuns: list.length,
      completedRuns: completed.length,
      totalDurationMs: totalDuration,
      wallClockMs,
      totalChars,
      avgChs: wallSec > 0 ? totalChars / wallSec : 0,
      peakChs: completed.reduce((m, r) => Math.max(m, r.peakChs), 0),
    });
  }
  out.sort((a, b) => a.c - b.c);
  return out;
}
