---
difficulty: hard
checks:
  - label: Renders without console errors
    verify: DevTools console clean on load
  - label: 5 balls present on load, in upper portion of viewport
    verify: Count + position check
  - label: Varied colors (≥3 distinct) AND varied sizes
    verify: Visual check
  - label: "Gravity: balls fall downward"
    verify: Watch the initial drop
  - label: Floor bounce with energy loss (each bounce shorter)
    verify: Watch a single ball — bounce height must decrease
  - label: Left and right wall bounces work
    verify: Throw a ball horizontally; it must reverse, not escape
  - label: Click on empty space spawns a ball at cursor
    verify: Click somewhere → ball appears there and falls
  - label: "Multiple balls coexist (clicks add, don't replace)"
    verify: Click 5 times → 10 total balls
  - label: "Ball-ball collision: no overlap or clipping"
    verify: Watch two balls meet — they must not pass through each other
  - label: "Ball-ball collision: visible momentum transfer"
    verify: Moving ball hits a still one — the still one moves
  - label: Balls come to rest eventually (no infinite jitter)
    verify: Wait 30 s — balls on floor should be still
  - label: Drag-to-throw launches ball with drag-direction velocity
    verify: Drag a ball up-right and release → flies up-right
  - label: Visible aim indicator (line from ball to cursor) during drag
    verify: Visual during drag
  - label: "'C' clears all balls; 'R' adds 5"
    verify: Test both keys
  - label: Ball count AND FPS counter visible and updating
    verify: Both numbers change as expected
  - label: Drag indicator length tracks cursor distance from ball
    verify: Short drag → short line; long drag → long line
  - label: Balls don't sink into the floor when stacked / at rest
    verify: Watch resting balls — they sit ON the floor, not partially below
  - label: Floor friction visibly slows rolling balls
    verify: Throw a ball horizontally; it should slow down on the floor, not slide forever
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — floor stays at bottom, no scrollbars or clipping
---

# Bouncing Balls Physics Sandbox

An interactive 2D physics sandbox: gravity, floor and wall bounces, ball-ball collisions, mouse drag-to-throw, and a live FPS counter. The heaviest test in the suite — collision detection alone is where many models break.

A model can write perfectly idiomatic event handlers and still produce a sim where balls clip through each other or oscillate forever. Watch for it.

## Prompt

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
