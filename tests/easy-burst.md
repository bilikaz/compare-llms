---
difficulty: easy
checks:
  - Renders without console errors
  - Dark background
  - Click spawns particles at the click position
  - At least 30 particles per burst
  - Particles spread radially (not all in one direction)
  - Particles fall under gravity (curve downward)
  - Particles fade and disappear (alpha decay)
  - Multiple bursts coexist without canceling each other
  - Layout stays usable when the window is resized
---

# Click to Burst

Mirror of the **Fireworks** test with the rocket stage and two-stage state machine removed — just click → particles burst. Tests particle spawning, radial spread, gravity, and alpha decay in isolation.

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
