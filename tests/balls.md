# Bouncing Balls Physics Sandbox — LLM Evaluation Rubric

Third benchmark task in the suite. Tests skills the clock and orrery
don't reach: physics simulation, collision detection + response, mouse
drag state, keyboard events, and numerical stability under stress.

Pair this with the geometric clock + solar system orrery for a 3-task suite.

---

## The prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an interactive
2D bouncing-balls physics sandbox.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport scene (100vw x 100vh), no scrollbars.
- Dark background (any shade, must contrast with balls).
- A visible "floor" line drawn across the bottom of the viewport.

INITIAL STATE
- On page load, 5 balls spawn at random positions in the upper third
  of the viewport.
- Each ball has:
    * Random radius between 15 and 40 px.
    * Random color drawn from a palette of at least 6 distinct, vivid colors.
    * Initial velocity: small random horizontal component, zero vertical.

PHYSICS
- Gravity pulls all balls downward at constant acceleration (~1500 px/s²).
- When a ball hits the floor:
    * Vertical velocity reverses with energy loss (coefficient ~0.75).
    * Horizontal velocity decays slightly (friction ~0.98).
- When a ball hits the left or right wall, horizontal velocity reverses
  with energy loss (~0.85).
- Ball-ball collisions: balls must not overlap. On contact, they exchange
  momentum (simplified elastic response is fine — but the result must be
  that balls separate, not stick or clip through each other).
- Balls eventually come to rest on the floor when their kinetic energy
  drops below a small threshold (no infinite micro-bouncing).

INTERACTION
- Click on empty space: spawn a new ball at the click position (random
  color + size, zero initial velocity — gravity takes over).
- Click and drag ON a ball: while dragging, draw a thin line from the ball
  center to the current cursor position to indicate aim direction. On
  release, launch the ball with an initial velocity vector matching the
  drag direction and magnitude (longer drag = faster throw).
- Keyboard 'C': clear all balls.
- Keyboard 'R': add 5 new random balls in the upper third.

UI
- In the top-left corner, display two live readouts:
    * "Balls: N" — current ball count, updating in real time.
    * "FPS: NN" — current frames per second, refreshing ~once per second.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- Must run by double-clicking in a modern browser.
- Smooth animation via requestAnimationFrame (not setInterval).
- No console errors on load.
- Total file size under 20 KB.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (15 mandatory checks)

| #  | Requirement                                              | How to verify                                                |
|----|----------------------------------------------------------|--------------------------------------------------------------|
| 1  | Renders without console errors                           | DevTools console clean on load                               |
| 2  | 5 balls present on load, in upper portion of viewport    | Count + position check                                       |
| 3  | Varied colors (≥3 distinct) AND varied sizes             | Visual check                                                 |
| 4  | Gravity: balls fall downward                             | Watch initial drop                                           |
| 5  | Floor bounce with energy loss (each bounce shorter)      | Watch a single ball — bounce height must decrease            |
| 6  | Left and right wall bounces work                         | Throw a ball horizontally; it must reverse, not escape       |
| 7  | Click on empty space spawns a ball at cursor             | Click somewhere → ball appears there and falls               |
| 8  | Multiple balls coexist (clicks add, don't replace)       | Click 5 times → 10 total balls                               |
| 9  | Ball-ball collision: no overlap or clipping              | Watch two balls meet — they must not pass through each other |
| 10 | Ball-ball collision: visible momentum transfer           | A moving ball hits a still one; the still one moves          |
| 11 | Balls come to rest eventually (no infinite jitter)       | Wait 30 s — balls on floor should be still                   |
| 12 | Drag-to-throw launches ball with drag-direction velocity | Drag a ball up-right and release; it flies up-right          |
| 13 | Visible aim indicator (line from ball to cursor) during drag | Visual during drag                                       |
| 14 | 'C' clears all balls; 'R' adds 5                         | Test both keys                                               |
| 15 | Ball count AND FPS counter visible and updating          | Both numbers change as expected                              |

**Score = passes / 15.**

---

## Optional bonus checks

| Check                                                  | Why it matters                                              |
|--------------------------------------------------------|-------------------------------------------------------------|
| Performance stable with 50+ balls                      | Tests algorithm choice (naive O(n²) is fine at this scale)  |
| Drag indicator length proportional to throw strength   | Often models draw a fixed-length line                       |
| Balls don't sink into floor when stacked               | Resting contact is harder than bouncing contact             |
| Mass scales with size (bigger balls less affected)     | Bonus: realistic momentum transfer                          |
| File size under 20 KB                                  | Conciseness                                                 |
| Floor friction visibly slows rolling balls             | Tests sustained horizontal motion handling                  |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| Balls fall through the floor      | One frame ball is above floor, next frame gone        | Velocity > radius per frame; missing penetration correction |
| Balls accelerate forever          | Bounces grow taller instead of shorter                | Forgot to multiply velocity by restitution coefficient      |
| Balls clip through each other     | Visually overlap, no interaction                      | No ball-ball collision implemented                          |
| Balls stick together              | On collision they merge or freeze                     | Position not corrected to separate them after impact        |
| Balls explode at high velocities  | Sudden teleport across screen                         | No max-velocity clamp; numerical instability                |
| Infinite micro-bouncing           | Balls jitter on the floor forever                     | No "at rest" threshold                                      |
| All balls same size or color      | Spec said varied, model used one constant             | Used single literal instead of randomized values            |
| Click does nothing                | No spawn on canvas click                              | Forgot mousedown handler, or canvas not capturing events    |
| Drag launches with wrong velocity | Ball flies opposite direction or random speed         | Sign error or reversed delta vector                         |
| Aim line missing                  | Ball moves on release, but no visible aim hint        | Skipped the drag-render step                                |
| 'C' or 'R' do nothing             | Keys ignored                                          | No keydown handler attached, or attached to wrong element   |
| FPS shows constant 60 forever     | Number never changes                                  | Hardcoded value instead of measured                         |
| FPS counter shows 1000+           | Wildly wrong numbers                                  | Used Δt wrong (e.g. divided by ms instead of seconds)       |
| Balls escape through corners      | Sometimes a ball flies out of the canvas              | Corner case where two collisions resolve in wrong order     |

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  5 balls spawn in upper third     |    ✓     |    ✓     |
| 3.  Varied colors & sizes            |    ✓     |    ✓     |
| 4.  Gravity falls                    |    ✓     |    ✓     |
| 5.  Floor bounce w/ energy loss      |    ✓     |    ✓     |
| 6.  Wall bounces                     |    ✓     |    ✓     |
| 7.  Click spawns ball at cursor      |    ✓     |    ✓     |
| 8.  Multiple balls coexist           |    ✓     |    ✓     |
| 9.  No ball-ball overlap             |    ✓     |    ✗     |
| 10. Momentum transfer visible        |    ✓     |    ✗     |
| 11. Balls come to rest               |    ✓     |    ✗     |
| 12. Drag-throw works                 |    ✓     |    ✗     |
| 13. Aim indicator drawn              |    ✓     |    ✗     |
| 14. 'C' clears, 'R' refills          |    ✓     |    ✓     |
| 15. Ball count + FPS visible         |    ✓     |    ✓     |
| **Total**                            | **15/15**| **10/15**|

Bonus:
- Stable with 50+ balls:            Yes / No
- Drag length scales velocity:      Yes / No
- Balls rest on floor (no clip):    Yes / No
- File size:                        X KB / Y KB
```

---

## Why this rounds out the suite

| Capability                          | Clock | Orrery | Sandbox |
|-------------------------------------|:-----:|:------:|:-------:|
| Radial / angular geometry           |  ✅   |   ✅   |    —    |
| Time / current-state binding        |  ✅   |   —    |    —    |
| Proportional sizing math            |  —    |   ✅   |    —    |
| Real-world factual recall           |  —    |   ✅   |    —    |
| Smooth animation                    |  ✅   |   ✅   |   ✅    |
| Pointer / hover interaction         |  —    |   ✅   |   ✅    |
| Z-order layering                    |  —    |   ✅   |    —    |
| Nested coordinate frames            |  —    |   ✅   |    —    |
| **Numerical integration (physics)** |  —    |   —    |   ✅    |
| **Collision detection + response**  |  —    |   —    |   ✅    |
| **Mouse drag state machine**        |  —    |   —    |   ✅    |
| **Keyboard event handling**         |  —    |   —    |   ✅    |
| **Real-time perf measurement (FPS)**|  —    |   —    |   ✅    |
| **Numerical stability under load**  |  —    |   —    |   ✅    |

The sandbox is the heaviest test — collision detection alone is where
many models break. A model can write perfectly idiomatic event handlers
and still produce a sim where balls clip through each other or oscillate
forever. Watch for it.

---

## Combined suite metric

When running all three tests, average rubric scores before applying speed:

```
suite_score = (clock_score / 13 + orrery_score / 15 + sandbox_score / 15) / 3
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

For a more weighted view, the sandbox is heavier work — you can optionally
weight it 1.5×:

```
weighted = (clock / 13 + orrery / 15 + 1.5 * sandbox / 15) / 3.5
```

---

## Variants for harder difficulty

**Tier 2 (medium)** — Add:
- A draggable polygon obstacle (triangle or rectangle) that balls also bounce off.
- A "wind" slider (-1 to 1) that adds horizontal acceleration.
3 extra checks: obstacle collides, obstacle drags smoothly, wind affects all balls.

**Tier 3 (hard)** — Replace gravity with a 2D "soft body" cloth: 30+ point
masses connected by springs (Verlet integration), pinned at top, swinging
under gravity, draggable by mouse, with cloth tearing if a spring stretches
beyond a threshold. Tests Verlet integration, constraint solving, and
spatial data structures. Most models will fail.

---

## Notes for benchmarking workflow

- **The sandbox has more variance than the clock/orrery** — physics bugs
  can make a borderline-pass become a fail randomly. Run **5+ rounds**
  here, not just 3, and use median rubric score.
- **Watch the simulation for at least 30 seconds** before scoring. Bugs
  like "infinite jitter" or "balls escape after 1000 frames" only show
  up after time passes.
- **Test interactions actively** — score #12, 13, 14 require you to
  click and drag and press keys. Don't score from a screenshot.
- **Save a screen recording**, not just a screenshot, for archive.
  Physics tests are time-dependent; stills lose information.
- For automated scoring: a Puppeteer script can simulate clicks,
  drags, and keypresses, then assert expected DOM/canvas state.
  More involved than the clock/orrery graders but doable.