---
difficulty: medium
checks:
  - label: Renders without console errors
    verify: DevTools console clean on load
  - label: Visible grid, alive vs dead clearly distinguishable
    verify: Visual — alive cells in vivid color, dead cells empty / background
  - label: Grid at least 60 × 40 cells
    verify: Count or eyeball
  - label: Click toggles cell state
    verify: Click empty → alive; click live → dead
  - label: Click-drag paints (not per-cell toggle)
    verify: Drag from a dead cell across live cells — they all turn alive
  - label: Play / Pause button works
    verify: Toggle state; simulation starts and stops
  - label: Step button advances exactly one generation
    verify: Press once → counter += 1; pattern updates one frame
  - label: Clear empties grid AND resets generation counter to 0
    verify: Both must happen on click
  - label: Random fills at roughly 30% density
    verify: Visual — not nearly empty (10%) or nearly full (50%+)
  - label: Speed slider changes generations per second in real time
    verify: Drag slider while running; speed visibly responds
  - label: Generation counter increments correctly
    verify: Step 5 times → counter shows 5
  - label: Live cell counter is accurate
    verify: Manually place 7 cells → counter shows 7
  - label: Glider glides correctly ★ (deterministic)
    verify: Place a 5-cell glider, run 4 generations → translated 1 cell diagonally, same shape
  - label: Blinker oscillates correctly ★ (deterministic)
    verify: 3 live cells in a horizontal row, run 1 generation → vertical row of 3
  - label: 2×2 block is stable ★ (deterministic)
    verify: Place a 2×2 block, run any number of generations — unchanged
  - label: Toroidal edges (wrap-around)
    verify: Spec allowed either; toroidal is the harder choice
  - label: Performance smooth at 30 gen/s on full grid
    verify: Slide speed to max — should not stutter
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — grid + control bar adapt, no clipping or scrollbars
---

# Conway's Game of Life

Conway's Game of Life with the standard B3/S23 rules, paint-on-drag editing, play/pause/step/random/clear controls, and a real-time speed slider.

The big win of this task: **patterns are deterministic**. Three rubric checks (glider glides, blinker oscillates, 2×2 block is stable) have exactly one correct answer — no "looks about right" gray zone. The strongest single discriminator when comparing two models that all "look like they pass."

## Prompt

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
