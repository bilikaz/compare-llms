---
difficulty: easy
checks:
  - Renders without console errors
  - 10×10 grid maze visible with at least 5 internal walls
  - Start cell green, end cell red
  - Player marker visible at start cell on load
  - Arrow keys move the player
  - Player cannot pass through walls (deterministic)
  - 'Reaching the end cell shows "You win!"'
  - The maze is actually solvable (a path exists)
  - Layout stays usable when the window is resized
---

# Static Maze with Player

Mirror of the **Maze** rubric with generation, solver, and randomness all dropped — just a hardcoded 10×10 maze with a keyboard-controlled player and wall collision. Tests that the model can wire up arrow keys, prevent moves through walls, and detect a win condition.

## Prompt

```
Generate a single self-contained HTML file: a small fixed maze with a
keyboard-controlled player.

REQUIREMENTS:
- A 10 × 10 grid maze. Cells are visible squares with walls drawn as
  thicker lines between them.
- The maze layout is hardcoded (you choose the layout) but must:
    * Have at least 5 walls inside the grid (not counting the outer boundary).
    * Have a valid path from the start cell to the end cell.
- A green start cell at top-left (cell 0,0).
- A red end cell at bottom-right (cell 9,9).
- A player marker (colored circle or square smaller than a cell) starts
  in the start cell after page load.
- Arrow keys move the player one cell in their direction (up/down/left/right).
- The player CANNOT move through walls. A keypress that would cross a
  wall is ignored.
- When the player reaches the end cell, display "You win!" somewhere
  visible on the page.

CONSTRAINTS:
- Single file, no external resources.
- No maze generation — hardcode the layout.
- No solver, no animation needed.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
