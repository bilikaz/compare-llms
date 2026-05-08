# Primitive LLM Benchmark Suite — 6 Simple Tasks

A parallel "easy mode" version of the full 6-task benchmark suite,
designed for weaker / smaller / older / quantized-down models that
fail the harder rubrics with all zeros (giving you no useful signal).

Each test here mirrors one from the full suite but stripped to ~30%
the complexity:
- Static where the original was animated
- Single-object where the original had many
- Hardcoded where the original required generation
- Fewer requirements (8 checks instead of 13–15)

Use this suite to:
- Get usable scores from models that flunk the full suite
- Establish a "floor" — does this model even understand the basics?
- Compare easy-vs-hard performance: a model that aces easy and bombs hard
  shows you where its capability ceiling actually sits
- Quickly screen many model variants before committing to full suite runs

---

# Test 1 — Static Analog Clock at 10:10

Mirrors the **Geometric Clock** rubric. Drops time-current binding,
animation, minute markers, and resize behavior. Tests only basic
geometry and trig.

(10:10 is the time used in clock advertising worldwide — both hands
point up-and-out, making the clock look like a smile.)

## Prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports) that displays a static analog clock face
showing the time 10:10.

REQUIREMENTS:
- A circular clock face centered on the page, ~400 px diameter, black outline.
- 12 hour markers around the rim as small lines or dots.
- Three clock hands all originating from the exact center:
    * Hour hand: black, thicker, pointing at the "10" position
      (i.e., toward upper-left).
    * Minute hand: black, thinner, pointing at the "2" position
      (i.e., toward upper-right) — this gives the 10:10 "smile" look.
    * Second hand: red, thinnest, pointing straight up toward "12".
- A small black dot at the exact center where the hands meet.

CONSTRAINTS:
- Single file. No external resources.
- No animation needed — entirely static.
- SVG or canvas, your choice.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences, no commentary.
```

## Rubric (8 checks)

| # | Requirement                                       |
|---|---------------------------------------------------|
| 1 | Renders without console errors                    |
| 2 | Circular clock face visible                       |
| 3 | At least 12 hour markers around the rim           |
| 4 | Three distinct hands present                      |
| 5 | Hour hand points to "10" (upper-left direction)   |
| 6 | Minute hand points to "2" (upper-right direction) |
| 7 | Second hand is red, hour and minute hands are black |
| 8 | Center pivot dot present                          |

**Common failures:**
- Hour hand points at 10 o'clock direction backwards
- All hands the same length or color
- Markers missing or wrong count
- "10:10" interpreted as something other than the smile-shape

---

# Test 2 — Solar System Lineup

Mirrors the **Orrery** rubric. Drops orbits, animation, sun glow, rings,
moons, and hover. Tests only factual recall (order + colors + sizes).

## Prompt

```
Generate a single self-contained HTML file that displays the solar system
as a static horizontal line-up of the sun and the 8 planets.

REQUIREMENTS:
- Black background.
- Sun on the left, then planets in correct order: Mercury, Venus, Earth,
  Mars, Jupiter, Saturn, Uranus, Neptune.
- Each body labeled with its name below it (white text).
- Roughly correct relative sizes — Jupiter must be visibly the largest
  planet, Mercury visibly the smallest.
- Roughly correct colors:
    Mercury gray, Venus pale yellow, Earth blue, Mars red,
    Jupiter tan, Saturn pale gold, Uranus pale cyan, Neptune deep blue.
- All bodies arranged in a single horizontal row.

CONSTRAINTS:
- Single file, no external resources.
- No animation.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```

## Rubric (8 checks)

| # | Requirement                                                     |
|---|-----------------------------------------------------------------|
| 1 | Renders without console errors                                  |
| 2 | Black background                                                |
| 3 | Sun present, visibly larger than every planet                   |
| 4 | Exactly 8 planets present                                       |
| 5 | Planets in correct order from sun outward                       |
| 6 | Planet names labeled below each body                            |
| 7 | Jupiter visibly biggest planet, Mercury visibly smallest        |
| 8 | At least 4 planet colors approximately right (Mars red, Earth blue, etc.) |

**Common failures:**
- Wrong order (alphabetical, or Earth/Venus swapped)
- All planets identical sizes
- Generic colors (all gray, all the same blue)
- Forgets Uranus or Neptune

---

# Test 3 — Single Bouncing Ball

Mirrors the **Sandbox** rubric. Drops everything except: one ball,
gravity, floor bounce. No clicks, no collisions, no drag, no UI.

## Prompt

```
Generate a single self-contained HTML file showing a single bouncing ball.

REQUIREMENTS:
- Full-viewport canvas with a clear background.
- A single colored circle (ball) starts in the upper portion of the screen.
- Gravity pulls the ball downward at constant acceleration.
- When the ball hits the floor (bottom of the canvas), it bounces back up
  with energy loss — each bounce must be visibly lower than the last.
- The ball eventually comes to rest on the floor.
- Smooth animation via requestAnimationFrame.

CONSTRAINTS:
- Single file, no external resources.
- No interaction needed — it just runs on load.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```

## Rubric (8 checks)

| # | Requirement                                              |
|---|----------------------------------------------------------|
| 1 | Renders without console errors                           |
| 2 | A visible colored circle on the page                     |
| 3 | Ball falls downward (gravity)                            |
| 4 | Ball bounces off the floor                               |
| 5 | Each bounce visibly lower than the last (energy loss)    |
| 6 | Ball eventually comes to rest (no infinite jitter)       |
| 7 | Smooth animation, not stepped                            |
| 8 | Ball does NOT fall through the floor                     |

**Common failures:**
- Ball falls through floor on first frame
- Ball bounces forever at the same height (no energy loss)
- Ball jitters infinitely on the floor (no rest threshold)
- Ball moves once then stops (no animation loop)

---

# Test 4 — Click to Burst

Mirrors the **Fireworks** rubric. Drops the rocket stage, trails,
auto-mode, two-stage state machine. Just click → particles burst.

## Prompt

```
Generate a single self-contained HTML file: click anywhere to spawn
a small particle burst at the click position.

REQUIREMENTS:
- Full-viewport canvas with a dark background.
- On click, spawn 30–60 particles at the click position.
- Particles fly outward in random directions.
- Particles fall under gravity (curve downward over time).
- Particles fade out and disappear after ~1–2 seconds.
- Multiple bursts can be active simultaneously (clicking again before
  the previous burst fades does NOT cancel the previous burst).
- Smooth animation via requestAnimationFrame.

CONSTRAINTS:
- Single file, no external resources.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```

## Rubric (8 checks)

| # | Requirement                                              |
|---|----------------------------------------------------------|
| 1 | Renders without console errors                           |
| 2 | Dark background                                          |
| 3 | Click spawns particles at the click position             |
| 4 | At least 30 particles per burst                          |
| 5 | Particles spread radially (not all in one direction)     |
| 6 | Particles fall under gravity (curve downward)            |
| 7 | Particles fade and disappear (alpha decay)               |
| 8 | Multiple bursts coexist without canceling each other     |

**Common failures:**
- Particles appear at fixed point regardless of click
- Particles fly straight without gravity
- Particles never fade (screen fills up with dots)
- New click clears the old burst
- Only 5–10 particles per burst

---

# Test 5 — Pattern Grid Editor

Mirrors **Game of Life** but drops the rules engine entirely. Just a
clickable grid editor with a glider preset and a clear button.

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

## Rubric (8 checks)

| # | Requirement                                              |
|---|----------------------------------------------------------|
| 1 | Renders without console errors                           |
| 2 | Visible grid of ≥20×20 cells with gridlines              |
| 3 | Alive vs dead cells visually distinct                    |
| 4 | Click toggles a cell between alive and dead              |
| 5 | "Place Glider" button works and places exactly the 5-cell glider shape |
| 6 | "Clear" button empties the entire grid                   |
| 7 | Live cell counter is accurate after clicks               |
| 8 | Counter resets to 0 after Clear                          |

**Common failures:**
- Click toggles wrong cell (off-by-one in coordinate math)
- Glider placed in wrong shape (mirrored or rotated)
- Counter doesn't update on click
- Clear leaves a stale counter value
- Grid too small (10×10 or less)

---

# Test 6 — Static Maze with Player

Mirrors the **Maze** rubric. Drops generation, solver, and randomness.
Just a hardcoded maze with keyboard-controlled player and wall collision.

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

## Rubric (8 checks)

| # | Requirement                                              |
|---|----------------------------------------------------------|
| 1 | Renders without console errors                           |
| 2 | 10×10 grid maze visible with at least 5 internal walls   |
| 3 | Start cell green, end cell red                           |
| 4 | Player marker visible at start cell on load              |
| 5 | Arrow keys move the player                               |
| 6 | Player cannot pass through walls (deterministic)         |
| 7 | Reaching the end cell shows "You win!"                   |
| 8 | The maze is actually solvable (a path exists)            |

**Common failures:**
- Player walks through walls (no collision check)
- Player can't move at all (no keydown handler)
- Maze is unsolvable (walls block all paths)
- Win condition triggers in wrong cell or never triggers
- "Maze" is just empty grid with no internal walls

---

# Combined scoring

```
easy_suite_score = (clock + orrery + ball + burst + grid + maze) / (8 * 6)
                 = total_passes / 48
useful_tok_per_sec = avg_tok_per_sec * easy_suite_score
```

A model scoring 40+/48 on the easy suite is ready to attempt the full
suite. A model under 30/48 will get nothing useful from the hard tests
and you should stick with this battery for comparison.

---

# When to use easy vs hard suite

| Model situation                              | Use suite                            |
|----------------------------------------------|--------------------------------------|
| Frontier model (Sonnet/Opus, GPT-4-class)    | Hard suite only                      |
| Mid-tier (Qwen3-30B+, Llama 3 70B+, etc.)    | Hard suite, fall back to easy if needed |
| Small (7B–14B class)                         | Easy suite primarily                 |
| Heavily quantized (≤Q4 of small model)       | Easy suite                           |
| New / unknown model                          | Easy suite first, then hard          |
| Comparing speculative decoding methods       | Whichever the base model passes      |
| Baseline screening / regression testing      | Easy suite (faster, more sensitive)  |

The **easy-vs-hard delta** is itself a useful metric: a model that scores
0.85 on easy and 0.45 on hard has a clear capability ceiling at "knows
the basics, can't integrate." A model at 0.85/0.80 is well-balanced.
A model at 0.70/0.10 is a model that pattern-matches well but reasons
poorly — useful for code completion, dangerous for autonomy.

---

# Comparison table — easy vs hard tests

| Skill                       | Easy version            | Hard version            |
|-----------------------------|-------------------------|-------------------------|
| Geometry / hand placement   | Static 10:10            | Live ticking clock      |
| Factual recall (planets)    | Static lineup           | Animated orrery         |
| Physics                     | One ball, one floor     | Many balls + collisions |
| Particle system             | One-stage burst         | Two-stage rocket+burst  |
| Grid + state                | Editor only, no rules   | Full Conway sim         |
| Maze + collision            | Static, walk only       | Generated + auto-solve  |

If a model fails the same conceptual axis on BOTH suites (e.g. fails the
ball test AND the sandbox), the model can't do that skill at all.
If it passes easy and fails hard, the issue is integration / scale, not
the underlying concept.

---

# Notes for benchmarking workflow

- **Run all 6 easy tests first** for any new model. ~5 minutes total
  with reasonable generation speeds.
- **Score each test on its 8 checks**, sum to /48 total.
- **If easy ≥ 36/48** (75%), proceed to the hard suite.
- **If easy ≤ 24/48** (50%), the model is too weak for meaningful
  comparison on the hard suite — stay on easy.
- **Same prompt across runs** — don't tweak prompts between models or
  between rounds within a model.
- **Same temperature** (suggest 0.3–0.7 for code generation; 0.0 if
  you want pure determinism for round-to-round comparison).
- **3 rounds per test** is enough at this difficulty level; failures
  are rarely noisy.
- **Save raw HTML output** for archive — quick re-scoring if you
  refine the rubric later.