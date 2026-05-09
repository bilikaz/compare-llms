---
difficulty: hard
checks:
  - label: Renders without console errors
    verify: DevTools console clean on load
  - label: Black or dark blue background
    verify: Visual
  - label: Click launches a rocket from the bottom
    verify: Click anywhere → bright dot rises from bottom edge
  - label: Rocket has a visible fading trail
    verify: Trail visibly tapers to transparent behind the rocket
  - label: Rocket rises and decelerates (gravity acts during ascent)
    verify: Speed slows visibly toward apex
  - label: "Rocket explodes at the click's y-coordinate"
    verify: Explosion happens at click height, not random or at top
  - label: Explosion produces 60–120 particles
    verify: Visually a dense burst, not a sparse handful
  - label: Particles fly radially in all directions from burst point
    verify: Roughly circular spread, not a one-sided spray
  - label: Particles curve downward (gravity affects them)
    verify: Watch a few seconds — particles arc, not straight lines
  - label: Particles have fading trails
    verify: Each particle leaves a short tail behind it
  - label: Particles fade and disappear (alpha decay)
    verify: Burst dims and clears within ~1–2 s
  - label: Multiple fireworks can be active simultaneously
    verify: Click 5 times rapidly — all should burst, not just one
  - label: Color variety across fireworks
    verify: Different bursts in noticeably different colors
  - label: Auto-mode triggers after 3 s idle
    verify: Stop clicking, wait — fireworks self-launch
  - label: Particle count AND FPS visible and updating
    verify: Both numbers change as expected
  - label: Stays >30 FPS with 5+ simultaneous fireworks
    verify: Click rapidly to spawn many — FPS counter stays high
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — scene re-fits, no scrollbars or clipping
---

# Fireworks Particle System

Click → rocket → explosion. Tests particle lifecycle (spawn → fade → remove), two-stage state machines (rocket → burst), alpha decay, trail rendering, and idle-timer auto-mode.

Where the bouncing-balls sandbox stresses *quality* of physics (collisions must be correct), this stresses *quantity* — trivial math per particle but hundreds running at 60 FPS with alpha blending and trails. Different bottleneck, different failure modes.

## Prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an interactive
fireworks display.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport scene (100vw x 100vh), no scrollbars.
- Black or very dark blue background (night sky).
- A subtle horizon line a few pixels tall at the bottom edge.

ROCKETS (rising stage)
- On click anywhere in the upper 80% of the viewport, a rocket launches
  from a random x position at the bottom of the screen.
- The rocket is a small bright dot (3–5 px) with a fading trail behind it:
  at least 5 trail segments, each more transparent than the previous.
- The rocket rises with an initial upward velocity, decelerated continuously
  by gravity.
- The rocket's target altitude is the y-coordinate of the click. When the
  rocket reaches that y-coordinate (or runs out of upward velocity, whichever
  comes first), it triggers an explosion at that point.

EXPLOSIONS (burst stage)
- Each explosion spawns 60–120 particles in a single frame.
- Particles fly out radially from the explosion point in all directions
  with random speeds (creating a roughly circular burst pattern).
- Particles are affected by gravity (their paths curve downward over time).
- Each particle leaves a fading trail (3–5 segments) and has an alpha
  that decays over its lifetime.
- Particles disappear when their alpha reaches 0. Total particle lifetime
  ~1–2 seconds.
- Each explosion uses a random base color from a palette of at least
  6 distinct vivid colors. Particles within one explosion may vary slightly
  in hue/saturation but should clearly belong to the same firework.

AUTO-MODE
- If no user clicks happen for 3 seconds, a firework auto-launches to a
  random position. Auto-launches continue every 1–2 seconds until the
  user clicks again, at which point the 3-second idle timer resets.

UI
- In the top-left corner, show two live readouts:
    * "Particles: N" — current total particle count (rockets + explosion
       particles), updating in real time.
    * "FPS: NN" — current frames per second, refreshing ~once per second.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- Smooth animation via requestAnimationFrame.
- Must remain above 30 FPS with 5+ simultaneous fireworks active.
- Total file size under 20 KB.
- No console errors on load.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```
