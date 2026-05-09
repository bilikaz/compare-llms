---
difficulty: easy
checks:
  - Renders without console errors
  - A visible colored circle on the page
  - Ball falls downward (gravity)
  - Ball bounces off the floor
  - Each bounce visibly lower than the last (energy loss)
  - Ball eventually comes to rest (no infinite jitter)
  - Smooth animation, not stepped
  - Ball does NOT fall through the floor
  - Layout stays usable when the window is resized
---

# Single Bouncing Ball

Mirror of the **Bouncing Balls Sandbox**, stripped to one ball, gravity, and floor bounce — no clicks, no collisions, no drag, no UI. Tests whether the model can write a basic gravity + bounce + rest loop with `requestAnimationFrame`.

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
