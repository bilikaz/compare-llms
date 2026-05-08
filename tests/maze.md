# Maze Generator + Solver + Player — LLM Evaluation Rubric

Sixth benchmark task. Medium-to-hard difficulty. Tests three interlocking
skills: algorithmic correctness (maze generation), pathfinding correctness
(automated solver), and interactive navigation with collision (player).

Like Game of Life, this task has **deterministic correctness checks** —
properties that are objectively true or false. A maze with isolated cells
isn't "looking a bit off," it's broken. A solver path that passes through
a wall isn't "almost right," it's wrong.

Pair this with the clock + orrery + sandbox + fireworks + Life rubrics
for a 6-task suite spanning geometry, factual recall, physics quality,
physics quantity, rule-based logic, and graph algorithms.

---

## The prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an interactive
maze game with three modes: animated generation, automated solver, and
keyboard-controlled player navigation.

HARD REQUIREMENTS — implement ALL of them:

GRID
- A grid of square cells filling most of the viewport, with a control bar
  on one edge.
- Grid dimensions at least 15 × 15 cells (larger is fine).
- Walls between cells are drawn as solid black lines (~2 px thick).
- Open passages between cells have no line.
- Outer boundary always has walls.

GENERATION
- The maze is generated using a real maze-generation algorithm (depth-first
  recursive backtracker, Prim's, Kruskal's, or similar — your choice).
- Generation must be a "perfect maze": every cell is reachable from every
  other cell, and there is EXACTLY ONE path between any two cells (no loops).
- Generation must be animated: the user sees cells being carved out
  progressively, not appearing all at once. Reasonable speed: complete in
  1–4 seconds.
- The current "frontier" or "active" cell during generation should be
  visually distinct (e.g. highlighted color) while it advances.

START AND END
- Start cell at top-left (cell 0,0). Mark it with a distinct green color.
- End cell at bottom-right (cell W-1, H-1). Mark it with a distinct
  red or gold color.

PLAYER
- A player marker (a colored circle or square smaller than the cell) starts
  at the start cell once generation finishes.
- Arrow keys AND WASD both move the player one cell in their direction.
- Player CANNOT move through walls. A keypress that would cross a wall
  must be ignored (no jitter, no partial step).
- When the player reaches the end cell, display a "You win!" message
  somewhere visible, plus the final move count.

SOLVER
- A "Solve" button runs an automated pathfinder (BFS, DFS, A*, etc. —
  your choice) from start to end.
- The solver animates its exploration: cells being visited are colored
  one shade (e.g. light blue), and once the goal is found, the actual
  shortest path is highlighted in a second distinct color (e.g. yellow).
- Pressing Solve does not move the player; it just visualizes the path.

CONTROLS
- "New Maze" — generates a fresh maze, resets the player to start,
  resets the move counter, clears any solver visualization.
- "Solve" — runs the automated solver as described above.
- "Reset" — puts the player back at start with move counter zeroed,
  but keeps the same maze.

UI READOUTS
- "Moves: N" — current player move count, increments on each successful move.
- A status line that shows one of: "Generating...", "Ready", "Solving...",
  "You win!"

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- No console errors on load.
- Total file size under 22 KB.
- All animations smooth via requestAnimationFrame or controlled setTimeout.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (15 mandatory checks)

| #  | Requirement                                                  | How to verify                                                   |
|----|--------------------------------------------------------------|-----------------------------------------------------------------|
| 1  | Renders without console errors                               | DevTools console clean                                          |
| 2  | Visible maze grid with clear walls and passages              | Visual                                                          |
| 3  | Grid at least 15 × 15                                        | Count or eyeball                                                |
| 4  | Generation is animated (not instant)                         | Watch on load — visible carving over 1–4 s                      |
| 5  | **Generated maze is connected** ★ (deterministic)            | Every cell is reachable from start — no orphan regions          |
| 6  | **Generated maze is "perfect"** ★ (deterministic)            | Exactly one path between any two cells (no loops)               |
| 7  | Start cell distinct green; end cell distinct red/gold        | Visual                                                          |
| 8  | Player marker visible at start after generation              | Visual                                                          |
| 9  | Arrow keys AND WASD both move the player                     | Test all 8 keys                                                 |
| 10 | **Player cannot pass through walls** ★ (deterministic)       | Walk into every wall direction — must be blocked                |
| 11 | Move counter increments on successful moves only             | Hitting a wall doesn't increment                                |
| 12 | Reaching end cell triggers "You win!" message                | Walk to end → message appears                                   |
| 13 | "Solve" button highlights a valid path from start to end     | Path doesn't cross any walls; ends exactly at end cell           |
| 14 | Solver visualizes exploration (visited cells distinct from final path) | Two colors visible during solve                       |
| 15 | "New Maze" generates a DIFFERENT maze each time              | Click 5 times — mazes look noticeably different each time       |

★ = deterministic check. These have exactly one correct outcome.

**Score = passes / 15.**

---

## How to verify the deterministic checks

### Check #5: All cells reachable
Run the solver from start. If the solver visits every cell before finding
the end, the maze is fully connected. (For a perfect maze with W×H cells,
BFS will visit all W·H cells exactly once.) If the solver fails to find
the end, or visibly stops in a region without reaching all cells, the maze
has an isolated region.

### Check #6: No loops (perfect maze)
A perfect maze with N cells has exactly N−1 passages (open walls). You
can sanity-check by counting visible passages, but the easier visual test
is: look for any cell where you can walk in a circle and return to where
you started without backtracking. If you can, the maze has a loop and is
not perfect. Also: if the solver shows two equally short paths to the
end, the maze has a loop.

### Check #10: Player cannot pass through walls
Take the player to any cell. Identify which directions have walls and
which have passages. Try pressing the keys for the wall directions —
the player must not move and the move counter must not change. Try
this from at least 3 different cells, including a corner cell.

### Check #13: Solver path is valid
After clicking Solve, trace the highlighted path with your eyes. Every
step from one cell to the next must cross an open passage, never a wall.
The path must start at the green cell and end exactly at the red cell.

These four checks alone diagnose ~80% of all implementation bugs.

---

## Optional bonus checks

| Check                                                   | Why it matters                                                |
|---------------------------------------------------------|---------------------------------------------------------------|
| Generation algorithm produces visibly biased patterns   | Bonus: tells you which algo (DFS = long corridors, Prim's = bushy) |
| Solver shows shortest path (not just any path)          | DFS will give a valid path but not shortest; BFS/A* will      |
| Visited-cell color fades over time                      | Bonus visual polish                                            |
| Player marker animates smoothly between cells           | Tests interpolation                                            |
| "Hint" button briefly flashes next-best move            | Bonus: tests partial pathfinding                              |
| Difficulty selector (small/medium/large)                | Bonus interaction                                              |
| Win celebration animation (confetti, color flash)       | Bonus visual                                                   |
| File size under 22 KB                                   | Conciseness                                                    |
| Move counter shows efficiency vs optimal (e.g. 47/35)   | Bonus: requires knowing optimal path                           |

---

## Common failure modes

| Mode                                  | What you'll see                                              | Why it happens                                             |
|---------------------------------------|--------------------------------------------------------------|------------------------------------------------------------|
| **Maze with loops**                   | You can walk in a circle without backtracking                | Used random wall removal instead of a real algorithm       |
| **Isolated regions**                  | Some cells unreachable from start; solver dies               | Algorithm has a bug; cells weren't all visited during gen  |
| **Generation is instant**             | Maze appears in one frame                                    | Used recursion / batch update, no animation framing        |
| **Player phases through walls**       | Arrow keys move freely regardless of walls                   | Wall collision check missing entirely                      |
| **Player can't move at all**          | Keys do nothing                                              | No keydown handler, or wrong listener target               |
| **Only WASD or only arrows works**    | Half the controls dead                                       | Spec said both; model implemented one                      |
| **Move counter wrong**                | Counts wall-bumps too                                        | Incremented unconditionally instead of after movement      |
| **Solver path crosses walls**         | Highlighted path teleports through closed walls              | Pathfinder ignored the walls graph; just used grid distance|
| **Solver always finds same path**     | Even on different mazes, path looks identical                | Hardcoded path, didn't actually run pathfinder             |
| **Solver finds wrong end cell**       | Path stops short or runs past the goal                       | Off-by-one in goal check                                   |
| **Solver doesn't visualize exploration**| Just the final path appears, no visited cells              | Skipped the animation step                                 |
| **"New Maze" regenerates same maze**  | Click 5 times, same layout                                   | RNG seeded once, or no RNG used                            |
| **Win message never triggers**        | Reach end cell, nothing happens                              | Win check inside wrong branch, or coordinates miscompared  |
| **Win triggers in wrong cell**        | Message appears one cell before the actual end               | Off-by-one in end coordinate                               |
| **Walls drawn but not enforced**      | Walls visible but player walks through them                  | Collision uses one wall representation, rendering uses another |

The **most common bug** in this task is using two different representations
for "where the walls are" — one for rendering, one for collision/pathfinding.
When they go out of sync, the player walks through walls or the solver
ignores them. Symptom: the maze *looks* right but doesn't *behave* right.

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Maze visible w/ clear walls      |    ✓     |    ✓     |
| 3.  Grid ≥15×15                      |    ✓     |    ✓     |
| 4.  Generation animates              |    ✓     |    ✗     |
| 5.  ★ All cells reachable            |    ✓     |    ✓     |
| 6.  ★ Perfect maze (no loops)        |    ✓     |    ✗     |
| 7.  Start green, end red             |    ✓     |    ✓     |
| 8.  Player visible at start          |    ✓     |    ✓     |
| 9.  Arrow + WASD both work           |    ✓     |    ✓     |
| 10. ★ Walls block player             |    ✓     |    ✗     |
| 11. Move counter accurate            |    ✓     |    ✗     |
| 12. Win message on reaching end      |    ✓     |    ✓     |
| 13. Solver path is valid             |    ✓     |    ✗     |
| 14. Solver visualizes exploration    |    ✓     |    ✓     |
| 15. New Maze actually different      |    ✓     |    ✓     |
| **Total**                            | **15/15**| **10/15**|

Bonus:
- Solver finds shortest path:     Yes / No
- Smooth player movement:         Yes / No
- File size:                      X KB / Y KB
```

In the example above, Output B has the **classic dual-representation
bug**: walls are drawn but not enforced (#10), which propagates to the
solver also ignoring walls (#13), and probably explains the loop issue
in #6 too. Three failures, one root cause. The deterministic checks
revealed it cleanly.

---

## Why this rounds out the suite

| Capability                              | Clock | Orrery | Sandbox | Fireworks | Life | Maze |
|-----------------------------------------|:-----:|:------:|:-------:|:---------:|:----:|:----:|
| Geometry / proportions                  |  ✅   |   ✅   |   —     |    ✅     |  —   |  —   |
| Real-world factual recall               |  —    |   ✅   |   —     |    —      |  —   |  —   |
| Smooth animation                        |  ✅   |   ✅   |   ✅    |    ✅     |  ✅  |  ✅  |
| Pointer interaction                     |  —    |   ✅   |   ✅    |    ✅     |  ✅  |  —   |
| Physics simulation                      |  —    |   —    |   ✅    |    ✅     |  —   |  —   |
| Particle lifecycle                      |  —    |   —    |   —     |    ✅     |  —   |  —   |
| Cellular automata / rule-based logic    |  —    |   —    |   —     |    —      |  ✅  |  —   |
| Batch / double-buffered updates         |  —    |   —    |   —     |    —      |  ✅  |  —   |
| **Maze generation algorithm (DFS/Prim/etc)** | — |   —    |   —     |    —      |  —   |  ✅  |
| **Pathfinding algorithm (BFS/A*/etc)**  |  —    |   —    |   —     |    —      |  —   |  ✅  |
| **Graph traversal**                     |  —    |   —    |   —     |    —      |  —   |  ✅  |
| **Keyboard input handling (game-style)**|  —    |   —    |   —     |    —      |  —   |  ✅  |
| **Wall-collision logic (discrete)**     |  —    |   —    |   —     |    —      |  —   |  ✅  |
| **Win-state detection**                 |  —    |   —    |   —     |    —      |  —   |  ✅  |
| **Algorithmic correctness checks**      |  —    |   —    |   —     |    —      |  ✅  |  ✅  |
| **Random generation with constraints**  |  —    |   —    |   —     |    —      |  —   |  ✅  |

The maze is the only test that requires the model to implement *two
distinct graph algorithms* (one for generation, one for solving) and
have them agree on the same wall representation. That dual-correctness
constraint is rare and useful for separating models that "know" graph
algorithms from models that have only seen them in isolation.

---

## Combined suite metric (6 tasks)

```
suite_score = (clock/13 + orrery/15 + sandbox/15
             + fireworks/15 + life/15 + maze/15) / 6
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

Suggested weights with both algorithmic-correctness tasks emphasized:

```
weighted = (clock/13
          + orrery/15
          + 1.5 * sandbox/15
          + 1.25 * fireworks/15
          + 1.5 * life/15
          + 1.5 * maze/15) / 7.25
```

Maze and Life share a weight because both have deterministic checks
that the others lack — they're the suite's "ground truth" tasks.

---

## Variants for harder difficulty

**Tier 2 (medium-hard)** — Add:
- A "Speedrun" mode: a timer starts when the player makes their first move
  and stops on win, with a personal best stored in-memory across maze regenerations.
- Diagonal movement disabled (already implied) but add a "no-revisit penalty"
  that highlights cells the player has been through.
- Bonus 3 checks: timer accurate, PB persists across regens, revisit highlighting works.

**Tier 3 (hard)** — Add:
- Multi-floor maze: 3 stacked grids connected by "stairs" cells; switching
  floors with PageUp/PageDown.
- Fog of war: only cells within radius 3 of the player are visible; the
  rest is dark. The solver lifts the fog when run.
- Dynamic obstacles: 1–2 "ghosts" that move on a schedule and block cells.
Tests 3D-ish state, view-state per cell, and live obstacle handling.
Most models will fail.

---

## Notes for benchmarking workflow

- **Test the deterministic checks (5, 6, 10, 13) deliberately** — don't
  trust visual vibes. Click Solve and watch the path. Walk into walls
  on purpose. Check if Solve visits every cell.
- **Run "New Maze" at least 5 times** before scoring check 15. Some
  models nominally have RNG but produce nearly-identical mazes due to
  poor seeding.
- **Watch generation speed** — too fast (instant) fails check 4;
  too slow (>10 s) is a UX fail and wastes evaluation time.
- **3 rounds is enough** here, like Life — variance is low because most
  bugs are deterministic.
- **Auto-grading is feasible** for this task — Puppeteer can extract
  the wall-set from the DOM/canvas, run independent verification of
  reachability and tree-ness, simulate keystrokes, and assert win
  state. Of all 6 tasks this and Life are the easiest to fully automate.
- **Common short-circuit cheat**: a model might generate a "maze" that's
  just a straight corridor from start to end (passes connectivity, passes
  perfect-maze, passes solvability). Check that the maze actually has
  branches — count visible dead-ends. A real W×H perfect maze has
  ~W·H/4 dead-ends typically; a corridor has 0.