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
  charSamples: CharSample[]; // sampled every ~250ms while streaming
  // Derived/cached metrics, computed at completion:
  avgChs: number;          // avg chars/sec across the run
  peakChs: number;         // max 1s sliding window chars/sec
  // Voting (filled later by judge — may stay empty until reviewed):
  rubricVotes?: RubricVotes;
  ratedAt?: number;        // ms epoch of most-recent vote change; absent = unrated
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
