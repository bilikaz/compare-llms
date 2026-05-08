# Conway's Game of Life — LLM Evaluation Rubric

Fifth benchmark task. Medium difficulty. Tests skills none of the other
four touch: cellular automata, batch / double-buffered state updates,
rule-based logic, and grid-based interaction.

The big win of this task: **patterns are deterministic**. Three of the
rubric checks (glider glides, blinker oscillates, block is stable) have
exactly one correct answer — either the rules are implemented right or
they're not. No "looks about right" gray zone.

Pair this with the clock + orrery + sandbox + fireworks rubrics for a
5-task suite spanning geometry, factual recall, physics quality, physics
quantity, and algorithmic correctness.

---

## The prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an interactive
Conway's Game of Life simulator.

HARD REQUIREMENTS — implement ALL of them:

GRID
- A grid of square cells filling most of the viewport, with a control bar
  along one edge (top or side).
- Grid dimensions at least 60 columns × 40 rows.
- Cells are clearly distinguishable: alive cells filled in a vivid color,
  dead cells empty / background. Subtle gridlines between cells (1 px).

RULES (standard Conway B3/S23)
- A live cell with 2 or 3 live neighbors survives.
- A live cell with fewer than 2 or more than 3 live neighbors dies.
- A dead cell with exactly 3 live neighbors becomes alive.
- All cell updates must happen SIMULTANEOUSLY using a back-buffer.
  Do NOT mutate cells in place during a single generation step
  (this is the most common bug — patterns will not behave correctly
  if you mutate in place).
- Edges may be either bounded (off-grid cells are dead) or wrap-around
  (toroidal). Either is fine, but be consistent.

CONTROLS (visible buttons + a slider)
- "Play / Pause"  — toggles the simulation running state.
- "Step"          — advances exactly one generation. Should only be
                    enabled while paused, but enabling always is also fine.
- "Clear"         — kills all cells and resets the generation counter to 0.
- "Random"        — fills the grid with random live cells at ~30% density.
- Speed slider    — controls generations per second, range 1–30, with the
                    current value shown next to it.

INTERACTION
- Click on a dead cell: bring it to life.
- Click on a live cell: kill it.
- Click and drag across cells: paint all dragged-over cells to the opposite
  state of the cell where the drag started (Photoshop pencil-style — i.e.
  if you start the drag on a dead cell, every cell you drag over becomes
  alive, regardless of its current state). This must NOT be a per-cell
  toggle that flips state on every entry/exit.

UI READOUTS
- "Generation: N" — current generation counter, updates each step.
- "Live cells: N" — current count of live cells, updates each step.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- No console errors on load.
- Total file size under 18 KB.
- Speed must be controllable in real time via the slider while running.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (15 mandatory checks)

| #  | Requirement                                                  | How to verify                                                |
|----|--------------------------------------------------------------|--------------------------------------------------------------|
| 1  | Renders without console errors                               | DevTools console clean on load                               |
| 2  | Visible grid, alive vs dead clearly distinguishable          | Visual                                                       |
| 3  | Grid at least 60 × 40 cells                                  | Count or eyeball                                             |
| 4  | Click toggles cell state                                     | Click empty → alive; click live → dead                       |
| 5  | Click-drag paints (not per-cell toggle)                      | Drag from dead through live cells — they all turn alive       |
| 6  | Play / Pause button works                                    | Toggle state; simulation starts/stops                         |
| 7  | Step button advances exactly one generation                  | Press once → counter += 1; pattern updates one frame          |
| 8  | Clear empties grid AND resets generation counter to 0        | Both must happen on click                                     |
| 9  | Random fills at roughly 30% density                          | Visual: not nearly empty (10%) or nearly full (50%+)          |
| 10 | Speed slider changes generations per second in real time     | Drag slider while running; speed visibly responds             |
| 11 | Generation counter increments correctly                      | Step 5 times → counter shows 5                                |
| 12 | Live cell counter is accurate                                | Manually place 7 cells → counter shows 7                      |
| 13 | **Glider glides correctly** ★ (deterministic)                | Place a 5-cell glider, run 4 generations: it has translated by 1 cell diagonally and is the same shape |
| 14 | **Blinker oscillates correctly** ★ (deterministic)           | Place 3 live cells in a horizontal row, run 1 generation: they become a vertical row of 3 |
| 15 | **2×2 block is stable** ★ (deterministic)                    | Place a 2×2 block, run any number of generations: unchanged   |

★ = deterministic check. These three patterns have exactly one correct
behavior — they're the gold-standard test for whether the rules + batch
update are implemented correctly.

**Score = passes / 15.**

---

## Test patterns to set up by hand

### Glider (check #13)
```
. X .
. . X
X X X
```
After 4 generations, this exact shape reappears, translated 1 cell to the
right and 1 cell down (or whichever direction matches the glider's
orientation — the spec doesn't care which direction, just that it moves
intact).

### Blinker (check #14)
Generation 0:
```
X X X
```
Generation 1:
```
. X .
. X .
. X .
```
Generation 2: back to horizontal. It oscillates with period 2.

### Block (check #15)
```
X X
X X
```
Stable forever. Any number of generations later, still:
```
X X
X X
```

If any of these three behave differently, the rule implementation is
broken even if the simulation looks "alive" in random patterns.

---

## Optional bonus checks

| Check                                                  | Why it matters                                              |
|--------------------------------------------------------|-------------------------------------------------------------|
| Toroidal edges (wrap-around)                           | Spec allowed either; toroidal is slightly harder            |
| Cells fade in/out with brief animation                 | Bonus visual polish                                         |
| Generation history visible (heat-map of recent activity)| Bonus: tests memory / per-cell metadata                    |
| Keyboard shortcuts (space = pause, S = step, C = clear)| Bonus interaction                                           |
| Pattern picker dropdown (glider, gosper gun, pulsar)   | Tests whether model knows famous patterns                   |
| File size under 18 KB                                  | Conciseness                                                 |
| Performance smooth at 30 gen/s on full grid            | Tests efficient neighbor-counting                           |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| **In-place mutation**             | Glider doesn't glide; patterns evolve "wrong"         | Updated cells modify their own neighbors mid-step           |
| **Wrong rule numbers**            | Patterns die or explode unexpectedly                  | Off-by-one (e.g. B2/S23 or B3/S2) — easy to misremember     |
| **Neighbor count includes self**  | Universe over-populates and dies fast                 | Forgot to skip dx=0,dy=0 in the 3×3 sum                     |
| **Drag is per-cell toggle**       | Dragging across a row gives alternating alive/dead    | Used `cell.alive = !cell.alive` instead of `cell.alive = targetState` |
| **Drag only paints first cell**   | Click works, drag doesn't                             | Missed mousemove handler                                     |
| **Clear leaves generation counter**| Grid empties but counter still says 47                | Forgot to reset counter alongside cells                      |
| **Random density wrong**          | Random fills 50–80% (universe dies in 2 gens)         | Used `Math.random() < 0.5`                                  |
| **Speed slider stuck at one rate**| Slider moves but simulation runs constant speed       | Read slider value once at start, not each tick              |
| **Live cell counter incorrect**   | Says 100 when grid clearly has 50                     | Counted wrong array, or counted before update, or off-by-one|
| **Step doesn't advance generation counter** | Counter stays at 0 even when stepping       | Counter only increments inside the play loop                 |
| **Edges produce phantom cells**   | Activity at edges that shouldn't be there             | Inconsistent edge handling between counting + updating       |
| **Block is stable but blinker isn't** | One pattern works, another doesn't                | Subtle rule bug that only matters at certain neighbor counts |
| **Glider mutates over generations**| Starts as glider, becomes blob                       | Almost always in-place mutation — back-buffer not used       |
| **Click registers in wrong cell** | Clicking in cell (5,3) toggles cell (4,2) etc.        | Off-by-one in coordinate math, or padding/border miscounted  |

The single most common bug is **in-place mutation**. About a third of all
LLM Game of Life implementations have this bug. It often "looks fine" on
random grids — chaos hides it — but the deterministic patterns expose it
immediately. That's why checks 13/14/15 matter.

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Cells distinguishable            |    ✓     |    ✓     |
| 3.  Grid ≥60×40                      |    ✓     |    ✓     |
| 4.  Click toggles                    |    ✓     |    ✓     |
| 5.  Drag paints (not toggle)         |    ✓     |    ✗     |
| 6.  Play/Pause works                 |    ✓     |    ✓     |
| 7.  Step advances 1 gen              |    ✓     |    ✓     |
| 8.  Clear resets cells + counter     |    ✓     |    ✗     |
| 9.  Random ~30% density              |    ✓     |    ✓     |
| 10. Speed slider live-responsive     |    ✓     |    ✓     |
| 11. Gen counter accurate             |    ✓     |    ✓     |
| 12. Live counter accurate            |    ✓     |    ✓     |
| 13. ★ Glider glides                  |    ✓     |    ✗     |
| 14. ★ Blinker oscillates             |    ✓     |    ✓     |
| 15. ★ Block is stable                |    ✓     |    ✓     |
| **Total**                            | **15/15**| **12/15**|

Bonus:
- Toroidal edges:                 Yes / No
- Pattern picker:                 Yes / No
- File size:                      X KB / Y KB
- Smooth at 30 gen/s:             Yes / No
```

In the example above, Output B has the **classic in-place-mutation bug**:
the simple oscillator (blinker) and still life (block) survive because
they happen not to depend on update order, but the glider — which moves
across cells in a specific direction — corrupts. That single failed check
diagnoses the underlying bug exactly.

---

## Why this rounds out the suite

| Capability                          | Clock | Orrery | Sandbox | Fireworks | Life |
|-------------------------------------|:-----:|:------:|:-------:|:---------:|:----:|
| Radial / angular geometry           |  ✅   |   ✅   |   —     |    ✅     |  —   |
| Time / current-state binding        |  ✅   |   —    |   —     |    —      |  —   |
| Real-world factual recall           |  —    |   ✅   |   —     |    —      |  —   |
| Smooth animation                    |  ✅   |   ✅   |   ✅    |    ✅     |  ✅  |
| Pointer interaction                 |  —    |   ✅   |   ✅    |    ✅     |  ✅  |
| Physics (numerical integration)     |  —    |   —    |   ✅    |    ✅     |  —   |
| Rigid-body collision                |  —    |   —    |   ✅    |    —      |  —   |
| Particle lifecycle                  |  —    |   —    |   —     |    ✅     |  —   |
| Two-stage state machines            |  —    |   —    |   —     |    ✅     |  —   |
| **Cellular automata / rule logic**  |  —    |   —    |   —     |    —      |  ✅  |
| **Batch / double-buffered updates** |  —    |   —    |   —     |    —      |  ✅  |
| **Grid-based interaction**          |  —    |   —    |   —     |    —      |  ✅  |
| **Drag-paint vs toggle distinction**|  —    |   —    |   —     |    —      |  ✅  |
| **Deterministic correctness checks**|  —    |   —    |   —     |    —      |  ✅  |
| **Algorithmic correctness**         |  —    |   —    |   —     |    —      |  ✅  |

Game of Life is the only test in the suite where "almost right" is
detectably wrong. The clock, orrery, sandbox, and fireworks all have
some subjectivity in scoring. Life has *patterns* that either work or
don't work — period. That makes it the strongest single discriminator
when comparing two models that all "look like they pass."

---

## Combined suite metric (5 tasks)

```
suite_score = (clock/13 + orrery/15 + sandbox/15 + fireworks/15 + life/15) / 5
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

Suggested weights if you want to emphasize correctness:

```
weighted = (clock/13
          + orrery/15
          + 1.5 * sandbox/15
          + 1.25 * fireworks/15
          + 1.5 * life/15) / 5.75
```

Life is weighted heavily because the deterministic checks reveal real
implementation quality — a model passing 15/15 on Life is unambiguously
better than one passing 12/15, with no scoring debate possible.

---

## Variants for harder difficulty

**Tier 2 (medium-hard)** — Add:
- "Pattern library" dropdown with at least 5 famous patterns
  (glider, blinker, block, beehive, Gosper glider gun, pulsar).
- Selecting a pattern lets the user place it at the next click point.
- Bonus 3 checks: dropdown present, patterns load correctly, placement works.

**Tier 3 (hard)** — Add:
- Custom rule input: text fields for B and S strings (e.g. "B36/S23"
  for HighLife), with live-applying rules.
- Multi-state cells: extend to 3 or 4 states with fading death animation.
- Cell history visualization (recently-dead cells fade rather than vanish).
Tests rule abstraction + state-machine extension. Most models will fail
this tier.

---

## Notes for benchmarking workflow

- **Manually test the deterministic patterns** — don't rely on visual
  vibes for checks 13/14/15. Set up the exact configurations and step
  through them.
- **Pause the simulation** before placing test patterns. Otherwise
  you're racing the clock.
- **Check generation counter alignment** — after placing a glider and
  pressing Step exactly 4 times, the counter should read 4 and the
  glider should have moved 1 cell diagonally. If counter is off OR
  position is off, investigate which one is wrong.
- **3 rounds is enough** for this task — variance is low because most
  bugs are deterministic, not random.
- **Auto-grading is feasible** here — a Puppeteer script can place
  exact patterns by clicking specific cells, press Step a known number
  of times, and assert exact resulting cell positions. Far more reliable
  than auto-grading the physics tests.