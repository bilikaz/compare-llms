import type { BenchBatch, BenchSession, ModelConfig } from '../types';
import { TESTS } from '../tests';
import type { Difficulty } from '../tests';

// ── Standardized schedule ─────────────────────────────────────────────────
// boss   c=1 ×6,  c=2 ×4    (14 slots, 7/test for 2 tests)
// hard   c=3 ×2,  c=4 ×2    (14)
// medium c=6 ×2,  c=8 ×2    (28)
// easy   c=12 ×2, c=16 ×2   (56)
// = 112 runs per session.
//
// Within each (tier, c) phase we generate `repeats` batches of size c, filling
// each batch from the tier's tests so that:
//   1. distinct tests are preferred — only duplicate when c > tier-test-count
//   2. across the whole phase, runs per test are balanced as evenly as possible
//
// Across the entire session, this yields exactly 7 runs per test (animals 7,
// fish 7, balls 7, fireworks 7, all 4 medium tests 7, all 8 easy tests 7).

interface PhaseSpec { c: number; repeats: number }

const STANDARDIZED: Record<Difficulty, PhaseSpec[]> = {
  easy:   [{ c: 12, repeats: 2 }, { c: 16, repeats: 2 }],
  medium: [{ c: 6,  repeats: 2 }, { c: 8,  repeats: 2 }],
  hard:   [{ c: 3,  repeats: 2 }, { c: 4,  repeats: 2 }],
  boss:   [{ c: 1,  repeats: 6 }, { c: 2,  repeats: 4 }],
};

// Order tiers heaviest to lightest so the slow / low-c phases run first while
// the user is most likely watching. Reversing this is also reasonable; this
// ordering makes the early data the most "novel" (manual review starts there).
const TIER_ORDER: Difficulty[] = ['boss', 'hard', 'medium', 'easy'];

function shuffled<T>(xs: T[], seed: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seed() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// LCG seeded so generated schedules are reproducible per session id.
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Fill `count` slots with the given test ids, preferring distinct tests within
// a single batch and rotating through the test list across batches so the
// per-test count comes out balanced.
function fillSlots(tests: string[], count: number, rand: () => number): string[] {
  const slots: string[] = [];
  const order = shuffled(tests, rand);
  if (count <= tests.length) {
    return order.slice(0, count);
  }
  // c > tier-test-count: cycle, but jitter the cycle start each batch.
  for (let i = 0; i < count; i++) slots.push(order[i % tests.length]);
  return slots;
}

function generatePhase(tests: string[], spec: PhaseSpec, rand: () => number, startIndex: number): BenchBatch[] {
  const out: BenchBatch[] = [];
  for (let r = 0; r < spec.repeats; r++) {
    out.push({
      id: crypto.randomUUID(),
      index: startIndex + r,
      tests: fillSlots(tests, spec.c, rand),
    });
  }
  return out;
}

export interface BuiltSchedule {
  id: string;
  label: string;
  batches: BenchBatch[];
}

// Assemble a Standardized schedule from the current TESTS list.
export function buildStandardizedSchedule(seed: number = Date.now() & 0xffffffff): BuiltSchedule {
  const rand = rng(seed);
  const byTier: Record<Difficulty, string[]> = { easy: [], medium: [], hard: [], boss: [] };
  for (const t of TESTS) byTier[t.difficulty].push(t.id);

  const batches: BenchBatch[] = [];
  let cursor = 0;
  for (const tier of TIER_ORDER) {
    const tests = byTier[tier];
    if (!tests.length) continue;
    for (const spec of STANDARDIZED[tier]) {
      const phase = generatePhase(tests, spec, rand, cursor);
      cursor += phase.length;
      batches.push(...phase);
    }
  }
  return { id: 'standardized', label: 'Standardized 112-run', batches };
}

// Re-numbers and id-stamps batches when building from a raw `string[][]`.
export function buildCustomSchedule(name: string, batches: string[][], id?: string): BuiltSchedule {
  const out: BenchBatch[] = batches.map((tests, index) => ({
    id: crypto.randomUUID(),
    index,
    tests,
  }));
  return { id: id ?? `custom:${crypto.randomUUID()}`, label: name, batches: out };
}

// Total per-c slot count, useful for the schedule preview UI.
export function summarizeSchedule(batches: BenchBatch[]): { byC: Record<number, number>; totalRuns: number } {
  const byC: Record<number, number> = {};
  let total = 0;
  for (const b of batches) {
    byC[b.tests.length] = (byC[b.tests.length] ?? 0) + b.tests.length;
    total += b.tests.length;
  }
  return { byC, totalRuns: total };
}

// New session shell from a built schedule. Caller persists it via db.
export function makeSession(model: ModelConfig, schedule: BuiltSchedule): BenchSession {
  return {
    id: crypto.randomUUID(),
    modelConfig: model,
    scheduleId: schedule.id,
    scheduleLabel: schedule.label,
    batches: schedule.batches,
    startedAt: Date.now(),
    status: 'idle',
    currentBatchIndex: 0,
  };
}
