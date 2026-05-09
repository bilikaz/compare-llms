---
difficulty: medium
checks:
  - label: Renders without console errors
    verify: DevTools console clean
  - label: Visible maze grid with clear walls and passages
    verify: Walls are solid black lines; passages have no line
  - label: Grid at least 15 × 15
    verify: Count or eyeball
  - label: Generation is animated (not instant)
    verify: Watch on load — visible carving over 1–4 s
  - label: Generated maze is connected ★ (deterministic)
    verify: Every cell reachable from start — no orphan regions
  - label: Generated maze is "perfect" ★ (deterministic)
    verify: Exactly one path between any two cells (no loops)
  - label: Start cell distinct green; end cell distinct red / gold
    verify: Visual
  - label: Player marker visible at start after generation
    verify: Visual
  - label: Arrow keys AND WASD both move the player
    verify: Test all 8 keys
  - label: Player cannot pass through walls ★ (deterministic)
    verify: Walk into every wall direction — must be blocked
  - label: Move counter increments on successful moves only
    verify: Hitting a wall does not increment
  - label: 'Reaching end cell triggers "You win!" message'
    verify: Walk to end → message appears
  - label: '"Solve" button highlights a valid path from start to end'
    verify: Path doesn't cross any walls; ends exactly at end cell
  - label: Solver visualizes exploration (visited cells distinct from final path)
    verify: Two colors visible during solve
  - label: '"New Maze" generates a DIFFERENT maze each time'
    verify: Click 5 times — mazes look noticeably different
  - label: Solver shows the SHORTEST path (not just any path)
    verify: BFS / A* will give shortest; DFS won't
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — maze + controls adapt, no clipping or scrollbars
---

# Maze Generator + Solver + Player

Animated maze generation + automated pathfinder + keyboard-controlled player with wall collision. Three interlocking skills: algorithmic correctness (perfect maze — no loops or orphans), pathfinding correctness (the solver must show the *shortest* path), and interactive navigation.

Like Game of Life, this task has deterministic correctness checks — properties that are objectively true or false. A maze with isolated cells isn't "looking a bit off," it's broken.

## Prompt

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
