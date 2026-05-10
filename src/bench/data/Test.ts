// Test — leaf of the bench data hierarchy.
// One test execution = one prompt streamed against the model in one slot.
// Persisted: text, usage, duration, votes. NOT persisted: charSamples
// (those are live-only on the parent Run during streaming, dropped after).

import type {
  BenchRun,
  BenchRunStatus,
  RubricVote,
  RubricVotes,
  StreamUsage,
} from '../../types';
import { findTest, type Difficulty } from '../../tests';
import type { Tier } from './Tier';

// Wired by Bench at construction (Run.finalize) and at hydration (Bench.load).
// Lets a Test own its vote operation atomically — rebump its Tier, persist
// itself, notify subscribers — without holding a back-ref to Bench.
export interface TestContext {
  tier: Tier;
  persist: () => Promise<void>;
  notify: () => void;
}

export class Test {
  readonly id: string;
  readonly runId: string;        // parent Run.id (= persisted batchId)
  readonly slotIndex: number;
  readonly concurrency: number;
  readonly testId: string;
  readonly prompt: string;
  readonly startedAt: number;

  status: BenchRunStatus;
  output: string;
  thinking: string;
  usage: StreamUsage;
  durationMs: number;
  rubricVotes?: RubricVotes;
  ratedAt?: number;
  error?: string;

  constructor(r: BenchRun) {
    this.id = r.id;
    this.runId = r.batchId;
    this.slotIndex = r.slotIndex;
    this.concurrency = r.concurrency;
    this.testId = r.testId;
    this.prompt = r.prompt;
    this.startedAt = r.startedAt;
    this.status = r.status;
    this.output = r.output;
    this.thinking = r.thinking;
    this.usage = r.usage;
    this.durationMs = r.durationMs;
    this.rubricVotes = r.rubricVotes;
    this.ratedAt = r.ratedAt;
    this.error = r.error;
  }

  isDone(): boolean { return this.status === 'done'; }
  isAborted(): boolean { return this.status === 'aborted' || this.status === 'error'; }

  // ── Identity / classification ────────────────────────────────────────
  // testId is `<tier>-<name>` (e.g. `easy-walker`). Tier is derivable from
  // the prefix, no rubric lookup needed.
  tier(): Difficulty {
    return this.testId.split('-')[0] as Difficulty;
  }

  // ── Rubric helpers ───────────────────────────────────────────────────
  checkCount(): number {
    return findTest(this.testId)?.rubric.length ?? 0;
  }

  // Tally pass/fail counts against this Test's rubric definition.
  countVotes(): { voted: number; passes: number; checkCount: number } {
    const checks = findTest(this.testId)?.rubric ?? [];
    const votes = this.rubricVotes ?? {};
    let voted = 0, passes = 0;
    for (const c of checks) {
      const v = votes[c.id];
      if (v === 'pass') { voted++; passes++; }
      else if (v === 'fail') { voted++; }
    }
    return { voted, passes, checkCount: checks.length };
  }

  // ── Vote operations ──────────────────────────────────────────────────
  // Bench wires ctx after construction. Required — vote() throws if missing,
  // since detached Tests (mid-flight, pre-finalize) aren't votable.
  private ctx?: TestContext;
  attachCtx(ctx: TestContext): void { this.ctx = ctx; }

  async vote(checkId: string, v: RubricVote | undefined): Promise<void> {
    if (!this.ctx) throw new Error(`Test.vote on detached test ${this.id}`);
    const before = this.countVotes();
    const next: RubricVotes = { ...(this.rubricVotes ?? {}) };
    if (v === undefined) delete next[checkId];
    else next[checkId] = v;
    this.rubricVotes = next;
    this.ratedAt = Date.now();
    const after = this.countVotes();
    this.ctx.tier.rebumpVote(
      { voted: before.voted, passes: before.passes },
      { voted: after.voted, passes: after.passes },
      before.checkCount,
    );
    await this.ctx.persist();
    this.ctx.notify();
  }

  // Set every check on this Test's rubric to the same vote in one shot.
  // One mutation, one persist, one notify — no N-write storm.
  async voteAll(v: RubricVote): Promise<void> {
    if (!this.ctx) throw new Error(`Test.voteAll on detached test ${this.id}`);
    const checks = findTest(this.testId)?.rubric ?? [];
    if (checks.length === 0) return;
    const before = this.countVotes();
    const next: RubricVotes = {};
    for (const c of checks) next[c.id] = v;
    this.rubricVotes = next;
    this.ratedAt = Date.now();
    const after = this.countVotes();
    this.ctx.tier.rebumpVote(
      { voted: before.voted, passes: before.passes },
      { voted: after.voted, passes: after.passes },
      before.checkCount,
    );
    await this.ctx.persist();
    this.ctx.notify();
  }

  // ── Per-test scalars (precise — Test owns these) ─────────────────────
  totalChars(): number { return this.output.length + this.thinking.length; }
  thinkingChars(): number { return this.thinking.length; }

  // Real token totals when the provider reports usage; otherwise estimate
  // from chars÷4. The `estimated` flag tells the caller whether to render
  // a `~` prefix.
  totalTokens(): { value: number; estimated: boolean } {
    const real = (this.usage.outputTokens ?? 0) + (this.usage.thinkingTokens ?? 0);
    if (real > 0) return { value: real, estimated: false };
    return { value: Math.round(this.totalChars() / 4), estimated: true };
  }
  thinkingTokens(): { value: number; estimated: boolean } {
    const real = this.usage.thinkingTokens;
    if (real != null && real > 0) return { value: real, estimated: false };
    return { value: Math.round(this.thinkingChars() / 4), estimated: true };
  }

  // True per-test throughput: own chars / own duration. No window math.
  charsPerSec(): number {
    const sec = this.durationMs / 1000;
    return sec > 0 ? this.totalChars() / sec : 0;
  }
  tokensPerSec(): { value: number; estimated: boolean } {
    const sec = this.durationMs / 1000;
    if (sec <= 0) return { value: 0, estimated: true };
    const t = this.totalTokens();
    return { value: t.value / sec, estimated: t.estimated };
  }

  // Persisted shape — note: no charSamples. The runner's transient sampling
  // data is consumed by Run.computeSummary() before the test gets here.
  toPersisted(): BenchRun {
    return {
      id: this.id,
      sessionId: '',  // filled by Bench.persistTest
      batchId: this.runId,
      batchIndex: 0,  // filled by Bench.persistTest
      slotIndex: this.slotIndex,
      concurrency: this.concurrency,
      testId: this.testId,
      prompt: this.prompt,
      startedAt: this.startedAt,
      status: this.status,
      output: this.output,
      thinking: this.thinking,
      usage: this.usage,
      durationMs: this.durationMs,
      error: this.error,
      avgChs: this.charsPerSec(),
      rubricVotes: this.rubricVotes,
      ratedAt: this.ratedAt,
    };
  }
}
