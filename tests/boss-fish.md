---
difficulty: boss
checks:
  - Renders without console errors
  - Water gradient visible (lighter top → darker bottom)
  - Visible seafloor along the bottom
  - At least 2 seaweed/plants rooted on the seafloor
  - Fish #1 has body + triangular tail + ≥1 fin + 1 eye + mouth
  - Fish #1 is recognizable as a fish without a label
  - Fish #1 swims (moves horizontally with screen wrap)
  - Fish #2 has body + triangular tail + ≥1 fin + 1 eye + mouth
  - Fish #2 is visibly different from Fish #1 (size, color, AND shape)
  - Fish #2 swims at a noticeably different speed than Fish #1
  - At least 5 bubbles visible at any given time
  - Bubbles rise upward continuously
  - Bubbles wrap (disappear at top, respawn near seafloor)
  - Both fish wrap around the screen correctly (don't get stuck or vanish)
  - Scene reads as "underwater" at a glance (gestalt)
  - Bubble sizes vary (a mix of small + large)
  - Animation is smooth throughout — no stutter
  - Layout stays usable when the window is resized
---

# SVG Underwater Scene

Lighter alternative to the SVG Pasture test, roughly **¼ the output size**. Same skill axis (visual reasoning over SVG primitives, recognizable subjects, scene composition, animation) but with 2 fish instead of 4 mammals.

You lose the leg-count anatomical diagnostic, but generation is ~3× faster. Use as a screening test before committing to the full pasture run, or standalone when token budget is limited.

## Prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an animated
underwater scene constructed entirely from SVG primitives.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport SVG (100vw x 100vh), no scrollbars.
- Water gradient background: lighter blue near the top, darker blue near
  the bottom (linearGradient).
- A sandy or rocky seafloor along the bottom (~10–15% of viewport),
  in tan/beige/brown.

FISH — exactly 2 fish, visibly different from each other:

Each fish must be constructed from SVG primitives only. NO emoji, NO
Unicode characters as graphics, NO external images. Each fish must be
RECOGNIZABLE as a fish without a text label.

Required features for EACH fish:
- A body (oval, ellipse, teardrop, or simple shape).
- A triangular tail at the rear.
- At least 1 fin (top dorsal fin OR side fin OR both).
- Exactly 1 visible eye (circle with a pupil dot).
- A mouth indication (small line, curve, or open shape).

The two fish must be visually distinct:
- Different colors.
- Different sizes (one clearly larger than the other).
- Different overall body shape (e.g., one round/short, one long/slender).

BUBBLES
- At least 5 bubbles rising from somewhere on the seafloor.
- Each bubble is a small circle (white or light-blue, with optional
  highlight ring for sphericality).
- Bubbles drift upward continuously.
- When a bubble reaches the top of the viewport, it disappears and a
  new bubble respawns near the seafloor (continuous loop).
- Bubbles vary in size; smaller bubbles may rise faster.

SEAWEED / PLANTS
- At least 2 seaweed shapes rooted on the seafloor.
- Each seaweed is a green vertical wavy path or a stack of overlapping
  ellipses suggesting a plant.
- Seaweed may sway gently OR remain static — your choice.

ANIMATION
- Both fish must swim horizontally across the screen.
- Each fish must move at a noticeably different speed from the other.
- When a fish exits one side of the screen, it must reappear on the
  opposite side (wrap-around).
- Bubbles rise continuously as specified above.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no fetch, no network.
- No emoji, no Unicode pictographs (🐟🐠 etc.).
- All fish, bubbles, and seaweed must be SVG primitives only.
- Total file size under 18 KB.
- No console errors on load.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```
