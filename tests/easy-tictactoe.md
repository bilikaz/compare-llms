---
difficulty: easy
checks:
  - Renders without console errors
  - 3 × 3 grid of clickable cells visible
  - First click places X, second click places O, then alternates
  - Clicking a marked cell does nothing (no overwrite, no turn change)
  - Status display shows whose turn it is and updates each move
  - Win detection works for all 8 lines (deterministic)
  - Draw detection works when board fills with no winner (deterministic)
  - '"New Game" button resets the board and turn back to X'
  - Layout stays usable when the window is resized
---

# Tic-Tac-Toe

The smallest possible "real game" — discrete state, finite moves, win conditions, end-of-game lockout. Models that pass the other easy tests but fail this have a specific weakness: they can do *step-by-step state evolution* but can't reason about *terminal states*.

The win-detection check often catches sloppy implementations: rows and columns work, diagonals don't.

## Prompt

```
Generate a single self-contained HTML file that implements a 2-player
tic-tac-toe game (no AI — both moves are made by clicking).

REQUIREMENTS:
- A 3 × 3 grid of clickable cells, centered on the page. Each cell is a
  visibly outlined square (~80–120 px).
- Two players take turns: X goes first, then O, alternating.
- Clicking an empty cell places the current player's mark in it.
- Clicking an already-marked cell does NOTHING (no overwrite, no turn change).
- A status display somewhere on the page showing whose turn it is
  (e.g., "Player X's turn", "Player O's turn").
- When a player gets 3 in a row (row, column, OR diagonal), display
  "Player X wins!" or "Player O wins!" in the status, and stop accepting
  any further clicks until New Game is pressed.
- When the board fills with no winner, display "Draw!" and likewise stop
  accepting clicks.
- A "New Game" button that clears the board and starts a fresh game with
  Player X.

CONSTRAINTS:
- Single file, no external resources.
- No AI / computer player needed — humans click both X and O.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
