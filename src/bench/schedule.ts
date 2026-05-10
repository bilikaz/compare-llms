import type { BenchBatch, BenchSession, ModelConfig } from '../types';

// ── Standardized schedule ─────────────────────────────────────────────────
// Hand-built batch list. Every test appears exactly 7 times. Order:
//   easy   c=16 ×2, c=12 ×2   (56 slots, 8 tests × 7)
//   medium c=8  ×2, c=6  ×2   (28 slots, 4 tests × 7)
//   hard   c=4  ×2, c=3  ×2   (14 slots, 2 tests × 7)
//   boss   c=2  ×4, c=1  ×6   (14 slots, 2 tests × 7)
// = 22 batches, 112 runs.
//
// Easy tier runs first (high c, short outputs) so completed runs land fast and
// the user can rate them while the slower low-c boss phases keep grinding.
//
// Per-test counts are achieved by construction: each phase pair (c=N×2, c=M×2)
// is balanced so every test in the tier ends with the same per-tier total.
// If you add/remove a test from a tier, rebuild this list — there is no
// algorithm to fall back on.

const STANDARDIZED_BATCHES: string[][] = [
  // ── easy (8 tests × 7 = 56 slots) ──────────────────────────────────────
  // c=16 ×2 — each test 2× per batch (4× across both)
  ['easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker',
   'easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker'],
  ['easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker',
   'easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker'],
  // c=12 ×2 — together each test +3. Batch 1 doubles ball/burst/clock/grid;
  // batch 2 doubles lineup/paint/tictactoe/walker. Final easy total = 7 each.
  ['easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker',
   'easy-ball', 'easy-burst', 'easy-clock', 'easy-grid'],
  ['easy-ball', 'easy-burst', 'easy-clock', 'easy-grid', 'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker',
   'easy-lineup', 'easy-paint', 'easy-tictactoe', 'easy-walker'],

  // ── medium (4 tests × 7 = 28 slots) ────────────────────────────────────
  // c=8 ×2 — each test 2× per batch (4× across both)
  ['medium-clock', 'medium-game', 'medium-maze', 'medium-solar',
   'medium-clock', 'medium-game', 'medium-maze', 'medium-solar'],
  ['medium-clock', 'medium-game', 'medium-maze', 'medium-solar',
   'medium-clock', 'medium-game', 'medium-maze', 'medium-solar'],
  // c=6 ×2 — together each test +3. Batch 1 doubles clock/game; batch 2 doubles maze/solar.
  ['medium-clock', 'medium-game', 'medium-maze', 'medium-solar', 'medium-clock', 'medium-game'],
  ['medium-clock', 'medium-game', 'medium-maze', 'medium-solar', 'medium-maze', 'medium-solar'],

  // ── hard (2 tests × 7 = 14 slots) ──────────────────────────────────────
  // c=4 ×2 — each test 2× per batch (4× across both)
  ['hard-balls', 'hard-fireworks', 'hard-balls', 'hard-fireworks'],
  ['hard-balls', 'hard-fireworks', 'hard-balls', 'hard-fireworks'],
  // c=3 ×2 — together each test +3. Batch 1 doubles balls; batch 2 doubles fireworks.
  ['hard-balls', 'hard-fireworks', 'hard-balls'],
  ['hard-fireworks', 'hard-balls', 'hard-fireworks'],

  // ── boss (2 tests × 7 = 14 slots) ──────────────────────────────────────
  // c=2 ×4 — each test 1× per batch (4× across all four)
  ['boss-animals', 'boss-fish'],
  ['boss-animals', 'boss-fish'],
  ['boss-animals', 'boss-fish'],
  ['boss-animals', 'boss-fish'],
  // c=1 ×6 — alternate animals/fish, 3× each.
  ['boss-animals'],
  ['boss-fish'],
  ['boss-animals'],
  ['boss-fish'],
  ['boss-animals'],
  ['boss-fish'],
];

export interface BuiltSchedule {
  id: string;
  label: string;
  batches: BenchBatch[];
}

// Materialize the hand-built batch list into BenchBatch records (fresh ids per
// session so reruns don't collide in IndexedDB).
export function buildStandardizedSchedule(): BuiltSchedule {
  const batches: BenchBatch[] = STANDARDIZED_BATCHES.map((tests, index) => ({
    id: crypto.randomUUID(),
    index,
    tests: [...tests],
  }));
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
