import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { BenchRun, BenchSession, MetricUnit, ModelConfig, RubricVote, RubricVotes } from '../types';
import { loadConfigs, saveConfigs } from '../storage';
import { buildStandardizedSchedule, makeSession } from '../bench/schedule';
import { runSession, type LiveRun, aggregateByC } from '../bench/runner';
import { putBenchSession, getBenchSession, getBenchRunsBySession, putBenchRun } from '../db';
import { ModelCard } from '../ui/ModelCard';
import { PreviewBar } from '../ui/PreviewBar';
import { ReviewBanner } from '../ui/ReviewBanner';
import { findTest } from '../tests';
import type { OverflowLevel, ViewMode } from '../ui/PreviewArea';
import { SchedulePreview } from './bench/SchedulePreview';
import { PhaseHeader } from './bench/PhaseHeader';
import { SlotGrid } from './bench/SlotGrid';
import { PerCStatsCard, type PerCRow } from './bench/PerCStatsCard';
import {
  CompletedList,
  applyFilterAndSort,
  type Filter,
  type SortKey,
} from './bench/CompletedList';
import { ReviewOverlay } from './bench/ReviewOverlay';
import { downloadSessionJson } from './bench/exportSession';
import { ACCENT_BENCH, LAST_SESSION_KEY } from './bench/utils';

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  overflow: OverflowLevel;
  onOverflowChange: (v: OverflowLevel) => void;
  unit: MetricUnit;
  registerExport: (fn: () => void) => void;
  showConfig: boolean;
}

// BenchMode is the orchestrator for the Benchmark tab. State + side effects
// live here; visual blocks are pulled from `./bench/*`. The mental model:
//   1. Idle (no session) → render <SchedulePreview> with a start button.
//   2. Running           → <PhaseHeader> + <SlotGrid> + <PerCStatsCard>
//                          + <CompletedList>.
//   3. Reviewing a run   → <ReviewOverlay> replaces SlotGrid; the rest stays.
//
// All persistence flows through `db.ts` (IndexedDB). The configBench snapshot
// stays in localStorage so refreshes don't lose it.
export function BenchMode({
  view, onViewChange, overflow, onOverflowChange, unit, registerExport, showConfig,
}: Props) {
  // ── Config + session state ──────────────────────────────────────────
  const initial = loadConfigs();
  const [configBench, setConfigBench] = useState<ModelConfig>(
    initial.configBench ?? initial.configA,
  );
  const [session, setSession] = useState<BenchSession | null>(null);
  const [liveRuns, setLiveRuns] = useState<Record<number, LiveRun>>({});
  const [completedRuns, setCompletedRuns] = useState<BenchRun[]>([]);
  const [running, setRunning] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveConfigs({ ...loadConfigs(), configBench });
  }, [configBench]);

  // Hydrate the most recent session on mount so reloads keep the user's view.
  useEffect(() => {
    let alive = true;
    (async () => {
      const last = localStorage.getItem(LAST_SESSION_KEY);
      if (!last) return;
      const s = await getBenchSession(last);
      if (alive && s) {
        setSession(s);
        const runs = await getBenchRunsBySession(s.id);
        if (alive) setCompletedRuns(runs.sort((a, b) => a.startedAt - b.startedAt));
      }
    })().catch(console.error);
    return () => { alive = false; };
  }, []);

  // The preview shown when no session is active. Seed makes it deterministic
  // so the schedule preview doesn't reshuffle on every render.
  const previewSchedule = useMemo(() => buildStandardizedSchedule(0xb01dface), []);

  // ── Session lifecycle ───────────────────────────────────────────────
  async function start() {
    if (!configBench.model || running) return;
    const built = buildStandardizedSchedule();
    const s = makeSession(configBench, built);
    setSession(s);
    setCompletedRuns([]);
    setLiveRuns({});
    setRunning(true);
    setReviewingId(null);
    localStorage.setItem(LAST_SESSION_KEY, s.id);
    await putBenchSession(s);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await runSession({
        session: s,
        signal: ctrl.signal,
        onBatchStart: () => setLiveRuns({}),
        onBatchEnd: (_batch, runs) => {
          setLiveRuns({});
          setCompletedRuns((prev) => [...prev, ...runs]);
        },
        onUpdate: (run) => {
          setLiveRuns((prev) => ({ ...prev, [run.slotIndex]: run }));
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  // Vote on a single check for one of the completed runs. Persists immediately.
  function voteRun(runId: string, checkId: string, v: RubricVote | undefined) {
    setCompletedRuns((rs) => rs.map((r) => {
      if (r.id !== runId) return r;
      const next: RubricVotes = { ...(r.rubricVotes ?? {}) };
      if (v === undefined) delete next[checkId];
      else next[checkId] = v;
      const updated: BenchRun = { ...r, rubricVotes: next, ratedAt: Date.now() };
      putBenchRun(updated).catch(console.error);
      return updated;
    }));
  }

  // ── Derived state ───────────────────────────────────────────────────
  const liveSlots = useMemo(
    () => Object.values(liveRuns).sort((a, b) => a.slotIndex - b.slotIndex),
    [liveRuns],
  );

  // Sum of chars produced at each 250 ms tick across all in-flight slots.
  // Provides the data points for the phase header sparkline.
  const phaseSparklineData = useMemo(() => {
    if (!liveSlots.length) return [];
    const buckets = new Map<number, number>();
    for (const r of liveSlots) {
      for (const s of r.charSamples) {
        const t = Math.floor(s.t / 250);
        buckets.set(t, (buckets.get(t) ?? 0) + s.chars);
      }
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }, [liveSlots]);

  // Per-c stats: actual aggregates from completed runs, plus zero-rows for
  // c-levels that haven't started yet (so the table shape is stable).
  const perC: PerCRow[] = useMemo(() => {
    const fromRuns = aggregateByC(completedRuns);
    const fromRunsMap = new Map(fromRuns.map((x) => [x.c, x]));
    const expected = new Map<number, number>();
    if (session) {
      for (const b of session.batches) {
        const c = b.tests.length;
        expected.set(c, (expected.get(c) ?? 0) + b.tests.length);
      }
    }
    const allCs = new Set<number>([...expected.keys(), ...fromRunsMap.keys()]);
    return Array.from(allCs)
      .sort((a, b) => a - b)
      .map((c) => ({ c, expected: expected.get(c) ?? 0, got: fromRunsMap.get(c) }));
  }, [completedRuns, session]);

  const filteredRuns = useMemo(
    () => applyFilterAndSort(completedRuns, filter, sortKey),
    [completedRuns, filter, sortKey],
  );

  const phase = useMemo(() => {
    if (!session) return null;
    const idx = session.currentBatchIndex;
    const batch = session.batches[idx];
    if (!batch) return null;
    return { c: batch.tests.length, batchIndex: idx, total: session.batches.length };
  }, [session]);

  const totalScheduledRuns = session
    ? session.batches.reduce((s, b) => s + b.tests.length, 0)
    : 0;

  const reviewing = reviewingId ? completedRuns.find((r) => r.id === reviewingId) : null;
  const reviewingTest = reviewing ? findTest(reviewing.testId) : null;

  // Export: register handler so the global header's button can fire it.
  const exportJSON = useCallback(() => {
    if (!session) return;
    downloadSessionJson(session, completedRuns);
  }, [session, completedRuns]);
  useEffect(() => { registerExport(exportJSON); }, [registerExport, exportJSON]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {reviewing && (
        <ReviewBanner onClose={() => setReviewingId(null)} closeLabel="close review">
          Reviewing: <b>{reviewing.testId}</b>
          {' · run '}{reviewing.id.slice(0, 6)}
          {' · c='}{reviewing.concurrency}
          {' · '}{(reviewing.durationMs / 1000).toFixed(1)}s
          {running && ' · session is still running'}
        </ReviewBanner>
      )}

      {showConfig && (
        <ModelCard
          config={configBench}
          onChange={setConfigBench}
          accent={ACCENT_BENCH}
          layout="row"
        />
      )}

      {!session && (
        <SchedulePreview
          schedule={previewSchedule}
          startDisabled={!configBench.model}
          onStart={start}
        />
      )}

      {reviewing && reviewingTest && session ? (
        <ReviewOverlay
          run={reviewing}
          test={reviewingTest}
          session={session}
          view={view}
          overflow={overflow}
          unit={unit}
          onViewChange={onViewChange}
          onOverflowChange={onOverflowChange}
          onVote={(checkId, v) => voteRun(reviewing.id, checkId, v)}
        />
      ) : (
        <>
          {phase && (
            <PhaseHeader
              phase={phase}
              liveSlots={liveSlots}
              sparklineData={phaseSparklineData}
              completedCount={completedRuns.length}
              totalRuns={totalScheduledRuns}
              running={running}
              onStop={stop}
            />
          )}

          {session && (
            <PreviewBar
              view={view}
              onViewChange={onViewChange}
              overflow={overflow}
              onOverflowChange={onOverflowChange}
              label={phase ? `preview · ${phase.c} slots · c=${phase.c} phase` : 'preview · idle'}
            />
          )}

          <SlotGrid slots={liveSlots} view={view} overflow={overflow} unit={unit} />

          {session && completedRuns.length > 0 && <PerCStatsCard rows={perC} unit={unit} />}

          {session && completedRuns.length > 0 && (
            <CompletedList
              runs={filteredRuns}
              totalCount={completedRuns.length}
              filter={filter}
              sortKey={sortKey}
              unit={unit}
              onFilterChange={setFilter}
              onSortChange={setSortKey}
              onOpen={setReviewingId}
            />
          )}
        </>
      )}
    </div>
  );
}
