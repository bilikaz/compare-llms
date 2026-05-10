---
difficulty: easy
checks:
  - Renders without console errors
  - 10×10 grid visible with the given wall layout
  - Start cell green, end cell red
  - Player marker visible at start cell on load
  - Arrow keys move the player
  - Player cannot enter wall cells (deterministic)
  - 'Reaching the end cell shows "You win!"'
  - The provided layout is rendered exactly as specified
  - Layout stays usable when the window is resized
---

# Static Maze with Player

Mirror of the **Maze** rubric with generation, solver, and randomness all dropped — a hardcoded 10×10 grid with a keyboard-controlled player and wall collision. Tests that the model can wire up arrow keys, prevent entry into wall cells, and detect a win condition. Layout is given so the model doesn't waste tokens "solving" it.

## Prompt

```
Generate a single self-contained HTML file: a fixed 10×10 grid with a
keyboard-controlled player.

USE THIS EXACT LAYOUT. `.` is an open cell, `#` is a wall cell, `S` is the
start (top-left), `E` is the end (bottom-right). Rows are top-to-bottom,
columns are left-to-right.

  S # . . . . . . . .
  . # . . . . . . . .
  . . # # # . # # . .
  . . . # . . . # . .
  # # . # . # . # # .
  . . . # . . . . # .
  . . . # . . # . # .
  . . . # . . # . # .
  . . # # . . # . # .
  . . . . . . # . # E

DO NOT verify solvability or invent your own layout — render the layout
above exactly as given. (It is solvable; the player can simply walk along
any of the open cells.)

REQUIREMENTS:
- 10 × 10 visible grid. Each cell is a square sized to fit the viewport.
- Wall cells (`#`) are clearly distinguishable from open cells (e.g.
  filled dark vs. light background).
- Start cell (top-left, `S`) is green.
- End cell (bottom-right, `E`) is red.
- A player marker (colored circle or square smaller than a cell) starts
  in the start cell after page load.
- Arrow keys move the player one cell in their direction
  (Up / Down / Left / Right).
- The player CANNOT enter a wall cell or move outside the grid. Such a
  keypress is ignored.
- When the player reaches the end cell, display "You win!" somewhere
  visible on the page.

CONSTRAINTS:
- Single file, no external resources.
- No maze generation, no solver, no animation needed.
- Hardcode the layout exactly as shown above; do not modify it.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
