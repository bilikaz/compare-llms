import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { BenchSession, MetricUnit, ModelConfig } from '../types';
import { loadConfigs, saveConfigs } from '../storage';
import { buildStandardizedSchedule, type BuiltSchedule } from '../bench/schedule';
import { Bench } from '../bench/data';
import type { Test } from '../bench/data/Test';
import { getBenchSessions, deleteBenchSession } from '../db';
import { ModelCard } from '../ui/ModelCard';
import { PreviewBar } from '../ui/PreviewBar';
import { ReviewBanner } from '../ui/ReviewBanner';
import { findTest } from '../tests';
import type { OverflowLevel, ViewMode } from '../ui/PreviewArea';
import { SchedulePreview } from './bench/SchedulePreview';
import { CustomBuilder } from './bench/CustomBuilder';
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
import { PastSessionsList } from './bench/PastSessionsList';
import { RatingSummary } from './bench/RatingSummary';
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

// BenchMode is a thin React adapter over the Bench engine. It owns:
//   - the configBench model snapshot (UI/storage concern)
//   - the schedule-mode toggle (standardized vs custom — UI state)
//   - the past-sessions list (loaded from IDB, refreshed on session changes)
//   - the active Bench instance (or null = landing screen)
//
// Everything else — session lifecycle, persistence, per-c stats, live slots,
// per-slot restart — lives on Bench. We subscribe to its notify() and force
// a re-render; children read derived state from `bench` directly.
export function BenchMode({
  view, onViewChange, overflow, onOverflowChange, unit, registerExport, showConfig,
}: Props) {
  const initial = loadConfigs();
  const [configBench, setConfigBench] = useState<ModelConfig>(
    initial.configBench ?? initial.configA,
  );
  const [bench, setBench] = useState<Bench | null>(null);
  const [, force] = useReducer((c: number) => c + 1, 0);
  const [pastSessions, setPastSessions] = useState<BenchSession[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'standardized' | 'custom'>('standardized');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  // Subscribe to Bench mutations so children see fresh derived state.
  useEffect(() => {
    if (!bench) return;
    return bench.subscribe(() => force());
  }, [bench]);

  useEffect(() => {
    saveConfigs({ ...loadConfigs(), configBench });
  }, [configBench]);

  const refreshPastSessions = useCallback(async () => {
    try {
      const all = await getBenchSessions();
      setPastSessions(all.sort((a, b) => b.startedAt - a.startedAt));
    } catch (e) { console.error(e); }
  }, []);

  // Mount: hydrate last session via Bench.load (which self-heals partials),
  // and refresh the past-sessions list.
  useEffect(() => {
    let alive = true;
    (async () => {
      const last = localStorage.getItem(LAST_SESSION_KEY);
      if (last) {
        const b = await Bench.load(last);
        if (alive && b) setBench(b);
      }
      if (alive) await refreshPastSessions();
    })().catch(console.error);
    return () => { alive = false; };
  }, [refreshPastSessions]);

  // ── Lifecycle handlers — all delegate to Bench ──────────────────────
  async function start(built: BuiltSchedule) {
    if (!configBench.model) return;
    if (bench?.isRunning()) return;
    bench?.stop();
    const b = await Bench.create(configBench, built);
    localStorage.setItem(LAST_SESSION_KEY, b.id);
    setBench(b);
    setReviewingId(null);
    b.run().finally(() => refreshPastSessions().catch(console.error));
  }

  function stop() { bench?.stop(); }

  async function resume() {
    if (!bench) return;
    await bench.resume();
    refreshPastSessions().catch(console.error);
  }

  function closeSession() {
    bench?.stop();
    setBench(null);
    setReviewingId(null);
    localStorage.removeItem(LAST_SESSION_KEY);
    refreshPastSessions().catch(console.error);
  }

  async function openSession(s: BenchSession) {
    bench?.stop();
    const b = await Bench.load(s.id);
    if (!b) return;
    setBench(b);
    setReviewingId(null);
    localStorage.setItem(LAST_SESSION_KEY, b.id);
  }

  async function resumeSession(s: BenchSession) {
    bench?.stop();
    const b = await Bench.load(s.id);
    if (!b) return;
    setBench(b);
    setReviewingId(null);
    localStorage.setItem(LAST_SESSION_KEY, b.id);
    if (!b.isComplete()) {
      // Defer one tick so subscribe wires up before the run notifies.
      await Promise.resolve();
      b.resume().finally(() => refreshPastSessions().catch(console.error));
    }
  }

  async function removeSession(id: string) {
    try {
      await deleteBenchSession(id);
      if (bench?.id === id) closeSession();
      await refreshPastSessions();
    } catch (e) { console.error(e); }
  }

  function restartSlot(slotIndex: number) {
    bench?.restartSlot(slotIndex).catch(console.error);
  }

  // ── Derived state for children — all from Bench ──────────────────────
  const liveSlots = bench?.liveSlots() ?? [];
  const phaseSparklineData = bench?.liveThroughput() ?? [];
  // Live Test instances — readers see fresh rubricVotes/ratedAt on every
  // render via the same object reference. Memo keys on test-list identity
  // (doneSlots), not on per-Test mutations, so list shape stays stable while
  // votes flow through the same instances.
  const completedTests = useMemo<Test[]>(
    () => bench?.runs.flatMap((r) => r.tests) ?? [],
    [bench, bench?.doneSlots()],
  );
  // Not memoized — filter/sort reads mutable fields (ratedAt, rubricVotes)
  // that change on vote without bumping doneSlots. Cheap for small N.
  const filteredTests = applyFilterAndSort(completedTests, filter, sortKey);

  // Per-c rows for the stats card. Built from Bench.batchList() (running
  // scalars from completed Runs) merged with the schedule's expected counts
  // so the table shape stays stable as runs land.
  const perC: PerCRow[] = useMemo(() => {
    if (!bench) return [];
    const expectedRuns = new Map<number, number>();
    const expectedTests = new Map<number, number>();
    for (const r of bench.runs) {
      const c = r.concurrency;
      expectedRuns.set(c, (expectedRuns.get(c) ?? 0) + 1);
      expectedTests.set(c, (expectedTests.get(c) ?? 0) + c);
    }
    const cs = new Set<number>([
      ...expectedRuns.keys(),
      ...bench.batchList().map((b) => b.c),
    ]);
    return Array.from(cs).sort((a, b) => a - b).map((c) => {
      const batch = bench.batchList().find((b) => b.c === c);
      return {
        c,
        expectedRuns: expectedRuns.get(c) ?? 0,
        expectedTests: expectedTests.get(c) ?? 0,
        got: batch && batch.runCount > 0 ? {
          runCount: batch.runCount,
          doneTestCount: batch.doneTestCount,
          sumWindowMs: batch.sumWindowMs,
          avgChs: batch.avgChs(),
          peakChs: batch.peakChs,
          minChs: batch.minChs,
        } : undefined,
      };
    });
  }, [bench, bench?.batches.size, bench?.doneSlots()]);

  const reviewing = reviewingId
    ? completedTests.find((t) => t.id === reviewingId) ?? null
    : null;
  const reviewingDef = reviewing ? findTest(reviewing.testId) : null;

  // Export — registered with the global header.
  const exportJSON = useCallback(() => {
    if (!bench) return;
    downloadSessionJson(bench.toBenchSession(), bench.benchRunRows());
  }, [bench]);
  useEffect(() => { registerExport(exportJSON); }, [registerExport, exportJSON]);

  const previewSchedule = useMemo(() => buildStandardizedSchedule(), []);
  const phase = bench?.phaseInfo() ?? null;
  const totalScheduledRuns = bench?.totalSlots() ?? 0;
  const completedCount = bench?.doneSlots() ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {reviewing && (
        <ReviewBanner onClose={() => setReviewingId(null)} closeLabel="close review">
          Reviewing: <b>{reviewing.testId}</b>
          {' · test '}{reviewing.id.slice(0, 6)}
          {' · c='}{reviewing.concurrency}
          {' · '}{(reviewing.durationMs / 1000).toFixed(1)}s
          {bench?.isRunning() && ' · session is still running'}
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

      {!bench && (
        <>
          {scheduleMode === 'standardized' ? (
            <SchedulePreview
              schedule={previewSchedule}
              startDisabled={!configBench.model}
              onStart={start}
              mode={scheduleMode}
              onModeChange={setScheduleMode}
            />
          ) : (
            <CustomBuilder
              startDisabled={!configBench.model}
              onStart={start}
              mode={scheduleMode}
              onModeChange={setScheduleMode}
            />
          )}
          <PastSessionsList
            sessions={pastSessions}
            onOpen={openSession}
            onResume={resumeSession}
            onDelete={removeSession}
          />
        </>
      )}

      {reviewing && reviewingDef && bench ? (
        <ReviewOverlay
          test={reviewing}
          def={reviewingDef}
          modelConfig={bench.modelConfig}
          view={view}
          overflow={overflow}
          unit={unit}
          onViewChange={onViewChange}
          onOverflowChange={onOverflowChange}
        />
      ) : (
        <>
          {bench && (
            <PhaseHeader
              phase={phase}
              liveSlots={liveSlots}
              sparklineData={phaseSparklineData}
              completedCount={completedCount}
              totalRuns={totalScheduledRuns}
              running={bench.isRunning()}
              sessionStatus={bench.status}
              unit={unit}
              onStop={stop}
              onClose={closeSession}
              onResume={resume}
            />
          )}

          {bench && (
            <PreviewBar
              view={view}
              onViewChange={onViewChange}
              overflow={overflow}
              onOverflowChange={onOverflowChange}
              label={phase ? `preview · ${phase.c} slots · c=${phase.c} phase` : 'preview · idle'}
            />
          )}

          <SlotGrid
            slots={liveSlots}
            view={view}
            overflow={overflow}
            unit={unit}
            onRestartSlot={bench?.isRunning() ? restartSlot : undefined}
          />

          {bench && completedTests.length > 0 && <PerCStatsCard rows={perC} unit={unit} />}

          {bench && bench.doneSlots() > 0 && <RatingSummary tiers={bench.tierList()} />}

          {bench && completedTests.length > 0 && (
            <CompletedList
              tests={filteredTests}
              totalCount={completedTests.length}
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
