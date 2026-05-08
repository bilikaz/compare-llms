# Easy Test 7 — Tic-Tac-Toe

Addition to the **Primitive LLM Benchmark Suite**. Covers a skill the
existing 6 easy tests miss: **simple game logic with state machines and
win detection**.

To integrate: append this section to `primitive-llm-benchmark-suite.md`
as Test 7, and update the combined scoring divisor from `/48` (8 checks
× 6 tests) to `/56` (8 × 7).

---

# Test 7 — Tic-Tac-Toe

Mirrors no test in the hard suite directly — fills a gap. Tests simple
turn-based state, click-to-mark logic, win condition detection, and
end-of-game lockout. Universally known so models from every era have
seen it in training, but the **win-detection** check often catches
sloppy implementations.

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

## Rubric (8 checks)

| # | Requirement                                                    |
|---|----------------------------------------------------------------|
| 1 | Renders without console errors                                 |
| 2 | 3 × 3 grid of clickable cells visible                          |
| 3 | First click places X, second click places O, then alternates   |
| 4 | Clicking a marked cell does nothing (no overwrite, no turn change) |
| 5 | Status display shows whose turn it is and updates each move    |
| 6 | **Win detection works for all 8 lines** ★ (deterministic)      |
| 7 | **Draw detection works when board fills with no winner** ★ (deterministic) |
| 8 | "New Game" button resets the board and turn back to X          |

★ = deterministic check. Test all 8 winning lines (3 rows, 3 columns,
2 diagonals) deliberately. A common bug is "win detection works for rows
and columns but missed the diagonals" — exactly the kind of off-by-one
sloppiness this rubric exists to catch.

## How to verify the deterministic checks

### Check #6: All 8 winning lines
Play through 8 separate games, each ending with a win on a different line:

```
Top row:        X X X      Middle col:   . X .      Diagonal:  X . .
                . . .                    . X .                 . X .
                O O .                    O O X                 . . X

(plus the other 5 line variants)
```

If any line fails to trigger "Player X wins!", the win detection is
incomplete. The classic bug pattern: **rows and columns work, diagonals
don't**.

### Check #7: Draw
Play out: X→O→X→O... until the board fills with no winner. Status must
show "Draw!" — not "Player O's turn" hanging forever.

A safe draw sequence:
```
X O X
X X O
O X O
```
9 clicks alternating starting with X, no 3-in-a-row anywhere.

## Common failures

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| Both players play X               | All clicks place X                                    | Turn variable never toggles                                  |
| Can overwrite cells               | Clicking O on an X cell makes it O                    | No "is cell empty" check before placing                      |
| **Diagonals not detected**        | Diagonal 3-in-a-row doesn't trigger win               | Win check only iterates rows + columns                       |
| Win declares wrong player         | X's three-in-a-row says "Player O wins"               | Check uses current turn instead of the line's contents      |
| Game continues after win          | Click after "wins!" still places marks                | Missing game-over flag, or check skipped                     |
| Status doesn't update             | Always says "Player X's turn"                         | Status set once at load, never re-rendered                   |
| New Game leaves status text       | Board clears but "Player X wins!" still shown         | Reset only clears cells, not the status                      |
| New Game doesn't reset turn       | New game starts with O                                | Turn variable not reset in handler                           |
| Draw never triggers               | Last cell click does nothing or status hangs          | Draw condition checked before final move's win check         |
| Diagonals work, rows don't        | Rare but happens                                      | Indexing bug in row check                                    |

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1. No console errors                 |    ✓     |    ✓     |
| 2. 3×3 grid of clickable cells       |    ✓     |    ✓     |
| 3. Alternates X then O               |    ✓     |    ✓     |
| 4. Marked cell unclickable           |    ✓     |    ✗     |
| 5. Turn status updates               |    ✓     |    ✓     |
| 6. ★ All 8 winning lines detected    |    ✓     |    ✗     |
| 7. ★ Draw correctly detected         |    ✓     |    ✓     |
| 8. New Game fully resets             |    ✓     |    ✓     |
| **Total**                            | **8/8**  | **6/8**  |
```

The example above shows the most common mid-tier result: model implemented
the basics but skipped diagonal win checks (#6) and didn't lock cells
after marking (#4). Both are sloppy-thinking bugs, not fundamental
misunderstanding.

## Updated combined scoring for the easy suite

With Test 7 added:

```
easy_suite_score = total_passes / (8 * 7)
                 = total_passes / 56
useful_tok_per_sec = avg_tok_per_sec * easy_suite_score
```

A model scoring 42+/56 (75%) on the easy suite is ready for the hard
suite. Under 28/56 (50%), stay on easy.

## Why this fills a gap

| Capability                           | Existing easy tests cover it? | Test 7 adds |
|--------------------------------------|:-----------------------------:|:-----------:|
| Geometry / static layout             |              ✅               |      —      |
| Factual recall                       |              ✅               |      —      |
| Basic physics                        |              ✅               |      —      |
| Particle effects                     |              ✅               |      —      |
| Grid + click toggle                  |              ✅               |      —      |
| Keyboard + collision                 |              ✅               |      —      |
| **Turn-based state machine**         |              —                |     ✅      |
| **Win condition checking**           |              —                |     ✅      |
| **End-of-game state lockout**        |              —                |     ✅      |
| **Reset-and-restart logic**          |              —                |     ✅      |

Tic-tac-toe is the smallest possible "real game" — discrete state,
finite moves, win conditions, end-of-game handling. Models that pass
the other 6 easy tests but fail tic-tac-toe have a specific weakness:
they can do *step-by-step state evolution* (Conway's grid editor,
maze player) but can't reason about *terminal states* (game over).
That's worth knowing.

## Notes for benchmarking

- **Manually play through all 8 winning lines** when scoring check 6.
  Don't trust visual vibes — actually play 8 games.
- **3 rounds is enough** at this difficulty level.
- **This test rarely fails on smaller models** because tic-tac-toe is
  in their training data extremely thoroughly. If a model fails this,
  it's a strong signal that it's truly weak — even Llama-2-7B passes
  this with ~7/8.