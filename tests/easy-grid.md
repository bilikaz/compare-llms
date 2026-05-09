---
difficulty: easy
checks:
  - Renders without console errors
  - Visible grid of ≥20×20 cells with gridlines
  - Alive vs dead cells visually distinct
  - Click toggles a cell between alive and dead
  - '"Place Glider" button works and places exactly the 5-cell glider shape'
  - '"Clear" button empties the entire grid'
  - Live cell counter is accurate after clicks
  - Counter resets to 0 after Clear
  - Layout stays usable when the window is resized
---

# Pattern Grid Editor

Mirror of **Game of Life** with the rules engine entirely removed — just a clickable grid editor with a glider preset and a clear button. Tests basic grid coordinates, click toggling, and a live counter readout, without the cellular-automata logic.

## Prompt

```
Generate a single self-contained HTML file: a clickable grid of cells
where you can edit and place a glider pattern.

REQUIREMENTS:
- A grid of at least 20 × 20 cells. Each cell is a small square (~20 px).
- Subtle gridlines between cells (~1 px gray).
- Alive cells filled in a vivid color; dead cells empty / background.
- Click on a cell to TOGGLE it between alive and dead.
- A "Place Glider" button that places a glider pattern at a fixed
  location near the upper-left, in this exact shape:
        . X .
        . . X
        X X X
  (X = alive, . = dead). Placing on an existing pattern overwrites
  those 9 cells without affecting the rest of the grid.
- A "Clear" button that empties the entire grid.
- A live counter showing "Live cells: N", updating in real time.

CONSTRAINTS:
- Single file, no external resources.
- NO simulation / rules — this is just a grid editor.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
