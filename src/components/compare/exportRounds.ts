import type { ModelConfig, Round, RoundResult, RubricVotes } from '../../types';
import { findTest } from '../../tests';

interface ExportArgs {
  rounds: Round[];
  configA: ModelConfig;
  configB: ModelConfig;
  // The currently-selected test (used to scope the filename — defaults to a
  // generic timestamped name if 'custom').
  currentTestId: string;
}

// Per-side metric block. Same fields as the bench export so both flows can be
// concatenated in a downstream tool without schema munging.
function metrics(rr: RoundResult) {
  const seconds = rr.durationMs / 1000;
  const realTokens = (rr.usage.outputTokens ?? 0) + (rr.usage.thinkingTokens ?? 0);
  const totalChars = rr.charCount + rr.thinkingCharCount;
  const tokens = realTokens > 0 ? realTokens : Math.round(totalChars / 4);
  return {
    durationMs: Math.round(rr.durationMs),
    durationSec: +seconds.toFixed(3),
    outputChars: rr.charCount,
    thinkingChars: rr.thinkingCharCount,
    totalChars,
    inputTokens: rr.usage.inputTokens ?? null,
    outputTokens: rr.usage.outputTokens ?? null,
    thinkingTokens: rr.usage.thinkingTokens ?? null,
    totalTokens: tokens,
    tokensEstimated: realTokens === 0,
    tokensPerSec: seconds > 0 ? +(tokens / seconds).toFixed(2) : 0,
    charsPerSec: seconds > 0 ? +(totalChars / seconds).toFixed(2) : 0,
  };
}

export function buildRoundsExport({ rounds, configA, configB, currentTestId }: ExportArgs) {
  const test = findTest(currentTestId);
  const exportRounds = rounds.map((r) => {
    const t = findTest(r.testId);
    const checks = t?.rubric ?? [];
    const rubricRows = (votes: RubricVotes | undefined) =>
      checks.map((c) => ({ id: c.id, label: c.label, vote: votes?.[c.id] ?? null }));
    const passes = (votes: RubricVotes | undefined) =>
      checks.reduce((n, c) => n + (votes?.[c.id] === 'pass' ? 1 : 0), 0);
    return {
      id: r.id,
      startedAt: new Date(r.startedAt).toISOString(),
      testId: r.testId ?? null,
      testTitle: t?.title ?? null,
      prompt: r.prompt,
      sides: {
        A: {
          config: r.configA,
          metrics: metrics(r.resultA),
          error: r.resultA.error ?? null,
          rubric: t ? {
            score: passes(r.resultA.rubricVotes),
            total: checks.length,
            votes: rubricRows(r.resultA.rubricVotes),
          } : null,
          output: r.resultA.text,
          thinking: r.resultA.thinking,
        },
        B: {
          config: r.configB,
          metrics: metrics(r.resultB),
          error: r.resultB.error ?? null,
          rubric: t ? {
            score: passes(r.resultB.rubricVotes),
            total: checks.length,
            votes: rubricRows(r.resultB.rubricVotes),
          } : null,
          output: r.resultB.text,
          thinking: r.resultB.thinking,
        },
      },
    };
  });
  return {
    exportedAt: new Date().toISOString(),
    configA,
    configB,
    currentTest: test ? { id: test.id, title: test.title } : null,
    rounds: exportRounds,
  };
}

export function downloadRoundsJson(args: ExportArgs): void {
  const data = buildRoundsExport(args);
  const test = findTest(args.currentTestId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = test
    ? `compare-llms-${test.id}-${Date.now()}.json`
    : `compare-llms-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
