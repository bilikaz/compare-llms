// Tier — per-difficulty aggregator (easy / medium / hard / boss).
//
// Sibling of Batch under Bench. Both are "cuts" of the same Tests: Batch
// groups by concurrency, Tier groups by difficulty. Same storage shape:
// scalar accumulators, no arrays, ingest one Test at a time.

import type { Difficulty } from '../../tests';
import type { TierTotals } from '../../types';
import type { Test } from './Test';

export class Tier {
  readonly tier: Difficulty;

  doneTestCount: number;
  fullyRatedTestCount: number;
  passChecks: number;
  failChecks: number;
  unratedChecks: number;
  totalChecks: number;
  sumDurationMs: number;

  constructor(tier: Difficulty, totals?: TierTotals) {
    this.tier = tier;
    this.doneTestCount = totals?.doneTestCount ?? 0;
    this.fullyRatedTestCount = totals?.fullyRatedTestCount ?? 0;
    this.passChecks = totals?.passChecks ?? 0;
    this.failChecks = totals?.failChecks ?? 0;
    this.unratedChecks = totals?.unratedChecks ?? 0;
    this.totalChecks = totals?.totalChecks ?? 0;
    this.sumDurationMs = totals?.sumDurationMs ?? 0;
  }

  // Bench calls this once per Test as Runs complete. checkCount/voted come
  // from the rubric definition (engine resolves it via findTest at ingest).
  ingestTest(t: Test, checkCount: number, voted: number, passes: number): void {
    this.doneTestCount += 1;
    this.totalChecks += checkCount;
    this.passChecks += passes;
    this.failChecks += (voted - passes);
    this.unratedChecks += (checkCount - voted);
    if (voted === checkCount && checkCount > 0) this.fullyRatedTestCount += 1;
    this.sumDurationMs += t.durationMs;
  }

  // Re-tally a single test's vote contribution after a vote change.
  // (Tests are mutable for `rubricVotes`; Tier needs to be updated in place.)
  rebumpVote(prevChecks: { voted: number; passes: number }, nextChecks: { voted: number; passes: number }, checkCount: number): void {
    // Remove previous contribution
    this.passChecks -= prevChecks.passes;
    this.failChecks -= (prevChecks.voted - prevChecks.passes);
    this.unratedChecks -= (checkCount - prevChecks.voted);
    if (prevChecks.voted === checkCount && checkCount > 0) this.fullyRatedTestCount -= 1;

    // Add new contribution
    this.passChecks += nextChecks.passes;
    this.failChecks += (nextChecks.voted - nextChecks.passes);
    this.unratedChecks += (checkCount - nextChecks.voted);
    if (nextChecks.voted === checkCount && checkCount > 0) this.fullyRatedTestCount += 1;
  }

  // Derived percentage (pass / scored). Returns null when nothing's scored.
  scorePct(): number | null {
    const scored = this.passChecks + this.failChecks;
    if (scored === 0) return null;
    return (this.passChecks / scored) * 100;
  }

  toJSON(): TierTotals {
    return {
      tier: this.tier,
      doneTestCount: this.doneTestCount,
      fullyRatedTestCount: this.fullyRatedTestCount,
      passChecks: this.passChecks,
      failChecks: this.failChecks,
      unratedChecks: this.unratedChecks,
      totalChecks: this.totalChecks,
      sumDurationMs: this.sumDurationMs,
    };
  }
}
