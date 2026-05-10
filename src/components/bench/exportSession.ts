import type { BenchRun, BenchSession } from '../../types';
import { findTest } from '../../tests';

// Builds a self-contained JSON snapshot of a session: the session metadata,
// then every run with its full output, thinking text, throughput metrics,
// char-sample timeseries, and rubric votes. The structure mirrors the spec
// in docs/ui.md §5.9.
//
// Returned as a plain object so callers can serialize it themselves if they
// want to ship it somewhere other than the browser download — the helper
// `downloadSessionJson` does the standard "save to file" flow.
export function buildSessionExport(session: BenchSession, runs: BenchRun[]) {
  return {
    exportedAt: new Date().toISOString(),
    session: {
      id: session.id,
      modelLabel: session.modelConfig.label,
      modelConfig: session.modelConfig,
      scheduleId: session.scheduleId,
      scheduleLabel: session.scheduleLabel,
      startedAt: new Date(session.startedAt).toISOString(),
      completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null,
      status: session.status,
      batchTotals: session.batchTotals ?? [],
    },
    runs: runs.map((r) => {
      const t = findTest(r.testId);
      const checks = t?.rubric ?? [];
      const votes = r.rubricVotes ?? {};
      const passes = checks.filter((c) => votes[c.id] === 'pass').length;
      return {
        id: r.id,
        batchIndex: r.batchIndex,
        slotIndex: r.slotIndex,
        concurrency: r.concurrency,
        testId: r.testId,
        testTitle: t?.title ?? null,
        startedAt: new Date(r.startedAt).toISOString(),
        status: r.status,
        metrics: {
          durationMs: r.durationMs,
          durationSec: +(r.durationMs / 1000).toFixed(3),
          outputChars: r.output.length,
          thinkingChars: r.thinking.length,
          totalChars: r.output.length + r.thinking.length,
          inputTokens: r.usage.inputTokens ?? null,
          outputTokens: r.usage.outputTokens ?? null,
          thinkingTokens: r.usage.thinkingTokens ?? null,
          avgChs: +r.avgChs.toFixed(2),
          // peakChs / charSamples are no longer persisted per-test (they
          // ballooned IDB into the GBs). Per-c peak / min ch/s are exported
          // via session.batchTotals; the per-test sparkline data is gone.
        },
        rubric: t ? {
          score: passes,
          total: checks.length,
          votes: checks.map((c) => ({ id: c.id, label: c.label, vote: votes[c.id] ?? null })),
          ratedAt: r.ratedAt ? new Date(r.ratedAt).toISOString() : null,
        } : null,
        output: r.output,
        thinking: r.thinking,
      };
    }),
  };
}

export function downloadSessionJson(session: BenchSession, runs: BenchRun[]): void {
  const data = buildSessionExport(session, runs);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compare-llms-bench-${session.id.slice(0, 8)}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
