export type ProviderKind = 'openai' | 'anthropic' | 'gemini';

export interface ModelConfig {
  id: string;
  label: string;
  provider: ProviderKind;
  baseUrl: string;
  model: string;
  apiKey: string;
  extra?: string;
}

export interface StreamUsage {
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
}

export type StreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'thinking'; delta: string }
  | { type: 'usage'; usage: StreamUsage }
  | { type: 'error'; message: string }
  | { type: 'done' };

export type RubricVote = 'pass' | 'fail';
export type RubricVotes = Record<string, RubricVote>;

export interface RoundResult {
  side: 'A' | 'B';
  text: string;
  thinking: string;
  usage: StreamUsage;
  durationMs: number;
  error?: string;
  rating?: number;
  charCount: number;
  thinkingCharCount: number;
  rubricVotes?: RubricVotes;
}

export interface Round {
  id: string;
  prompt: string;
  testId?: string;
  startedAt: number;
  configA: ModelConfig;
  configB: ModelConfig;
  resultA: RoundResult;
  resultB: RoundResult;
}

export interface AppState {
  configA: ModelConfig;
  configB: ModelConfig;
  rounds: Round[];
}

// ── Benchmark mode ────────────────────────────────────────────────────────

export type Mode = 'compare' | 'bench';

// Global preference: render throughput / volume metrics in characters or in
// tokens. Tokens are exact when the provider reports them in usage; otherwise
// they're estimated as chars÷4 and prefixed with `~`. The user picks one to
// keep the UI uncluttered (showing both at once was too dense).
export type MetricUnit = 'chars' | 'tokens';

// One sample of "chars produced so far" at a given timestamp during a stream.
// `t` is ms since the run started, `chars` is text.length + thinking.length.
export interface CharSample { t: number; chars: number }

export type BenchRunStatus = 'pending' | 'streaming' | 'done' | 'error' | 'aborted';

// Persisted Test shape. Intentionally lean: no per-tick char-samples array —
// those balloon a 112-run session to multi-GB and crash Firefox. Throughput
// stats are computed once at Run completion (using transient live samples)
// and aggregated as scalars on the parent Batch.
export interface BenchRun {
  id: string;
  sessionId: string;
  batchId: string;
  batchIndex: number;     // 0-based index of the batch within the session
  slotIndex: number;      // 0-based index within the batch (0..concurrency-1)
  concurrency: number;    // c value for the batch this run was part of
  testId: string;
  prompt: string;
  startedAt: number;      // wall-clock ms epoch when streaming started
  status: BenchRunStatus;
  output: string;
  thinking: string;
  usage: StreamUsage;
  durationMs: number;     // 0 while streaming, set on completion
  error?: string;
  // Derived/cached per-test metric, kept for legacy display:
  avgChs: number;          // chars / second across this single test
  // Voting (filled later by judge — may stay empty until reviewed):
  rubricVotes?: RubricVotes;
  ratedAt?: number;        // ms epoch of most-recent vote change; absent = unrated
}

// Per-c aggregated scalars persisted on the BenchSession. Filled by the
// engine (Bench.ts) as Runs complete — Batch ingests one RunSummary at a
// time and stores running totals only. No arrays, no per-second log.
export interface BatchTotals {
  c: number;
  sumWindowMs: number;     // total time at "all N producing" across runs
  sumWindowChars: number;  // chars produced inside those windows
  runCount: number;        // Runs at this c that completed successfully
  peakChs: number;         // max 1s aggregate ch/s ever seen at this c
  minChs: number;          // min ditto, excluding zero-rate ticks (0 = no data)
  doneTestCount: number;
}

// Per-tier (easy / medium / hard / boss) aggregated scalars persisted on
// the BenchSession. Filled by the engine as individual Tests land — Tier
// ingests one Test at a time and tracks rubric scores + raw test totals.
export interface TierTotals {
  tier: 'easy' | 'medium' | 'hard' | 'boss';
  doneTestCount: number;
  fullyRatedTestCount: number;
  passChecks: number;
  failChecks: number;
  unratedChecks: number;
  totalChecks: number;
  sumDurationMs: number;
}

export type BenchSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted' | 'interrupted';

export interface BenchSession {
  id: string;
  modelConfig: ModelConfig;   // snapshot of the model at session start
  scheduleId: string;          // 'standardized' or a custom-schedule id
  scheduleLabel: string;       // human-readable description
  batches: BenchBatch[];       // resolved batch list (test ids per slot)
  startedAt: number;
  completedAt?: number;
  status: BenchSessionStatus;
  currentBatchIndex: number;   // 0-based; equals batches.length when complete
  // Per-c aggregates filled by the engine as Runs complete. Lets us
  // rebuild PerCStatsCard rows on load without re-walking the (now stripped)
  // sample history.
  batchTotals?: BatchTotals[];
  // Per-tier aggregates filled by the engine as Tests land. Powers
  // RatingSummary without re-walking individual Tests on every render.
  tierTotals?: TierTotals[];
}

// A single batch in a session: a list of test ids that run in parallel.
// Concurrency is implicit (batch.tests.length).
export interface BenchBatch {
  id: string;
  index: number;
  tests: string[];   // test ids; length === concurrency
}

export interface CustomSchedule {
  id: string;
  name: string;
  batches: string[][]; // [[testId, ...], ...]
  createdAt: number;
}
