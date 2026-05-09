---
difficulty: medium
checks:
  - label: File renders without console errors
    verify: DevTools console clean on load
  - label: Black background
    verify: Visual
  - label: At least 50 visible stars (spec asks 100; allow some leniency)
    verify: Count or visual density check
  - label: Sun centered, yellow / orange, larger than every planet
    verify: Visual
  - label: Sun has glow / halo effect
    verify: Gradient or lighter ring around it
  - label: Exactly 8 planets present
    verify: Count
  - label: Planets in correct order from sun outward
    verify: Mercury → Neptune sequence
  - label: All orbits are concentric circles centered on sun
    verify: No offset orbits, no ovals (Saturn ring excepted)
  - label: Orbit paths are visible
    verify: Faint white circles must be drawn
  - label: Planet colors approximately match real appearance
    verify: Mars red, Earth blue, Jupiter tan, Neptune deep blue, etc.
  - label: Jupiter is the largest planet, Mercury the smallest
    verify: Visual — sizes correctly ordered
  - label: Saturn has visible rings
    verify: Tilted ellipse around Saturn
  - label: Earth has a moon orbiting it
    verify: Small gray body circling Earth
  - label: All planets orbit in the same direction (counter-clockwise)
    verify: Watch motion for a few seconds
  - label: Inner planets visibly faster than outer planets
    verify: Mercury laps Neptune within a few seconds
  - label: Hover label appears and follows the planet
    verify: Hover any planet — name shows AND tracks while it moves
  - label: Animation uses requestAnimationFrame (smooth, not stepped)
    verify: Stepped motion suggests setInterval
  - label: Earth's moon orbits faster than Earth orbits the sun
    verify: Watch the moon — it should go around several times per Earth orbit
  - label: Jupiter has visible bands / stripes (not flat color)
    verify: Visual — orange bands on the planet body
  - label: Stars are at varied brightness (not all the same white)
    verify: Spec said 30–100% brightness — visually mixed
  - label: Stars render BEHIND planets (correct z-order)
    verify: A star should never appear on top of a planet body
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — scene re-fits, no scrollbars or clipping
---

# Solar System Orrery

Animated solar system orrery: 8 planets in correct order with realistic colors and proportional sizes, concentric orbits at real-period ratios, Saturn rings, an Earth moon orbiting faster than Earth itself, hover labels that follow the planet, and ≥100 stars rendered behind everything else.

Tests proportional sizing math, orbital ratios, layered animation, z-order awareness, and pointer + animation interaction working together.

## Prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an animated
solar system orrery.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport scene (100vw x 100vh), no scrollbars.
- Black background (space).
- At least 100 white stars scattered randomly across the background,
  each with a brightness between 30% and 100%. Stars must be drawn
  BEHIND all planets and orbit paths.

SUN
- Yellow/orange filled circle at exact center of viewport.
- Radius: 30 px (or 4% of smaller viewport dimension, whichever is larger).
- Has a subtle glow/halo (lighter yellow ring around its edge).

PLANETS — exactly 8, in correct order from the sun outward:
Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune

For each planet:
- Drawn as a filled circle.
- Has a visible orbit path: a thin white circle at ~20% opacity.
- Orbits are concentric, centered on the sun.
- Colors must approximate real appearance:
    Mercury: gray
    Venus:   pale yellow / cream
    Earth:   blue (with optional green continents)
    Mars:    red / orange
    Jupiter: tan with orange bands or stripes
    Saturn:  pale gold
    Uranus:  pale cyan
    Neptune: deep blue
- Relative sizes (in pixels):
    Mercury 3, Venus 5, Earth 5, Mars 4,
    Jupiter 14, Saturn 12, Uranus 8, Neptune 8.

SATURN
- Must have visible rings: an ellipse rotated ~20°, thinner than the
  planet body, encircling Saturn and moving with it as it orbits.

EARTH
- Must have a moon: a smaller gray dot orbiting Earth at roughly 2× Earth's
  radius in distance, completing its orbit faster than Earth orbits the sun.

MOTION
- All planets orbit the sun in the SAME direction (counter-clockwise).
- Orbital speeds must reflect real ratios (inner faster, outer slower).
  Mercury should complete several full orbits while Neptune barely moves.
- Suggested timing: Mercury orbits in ~3 s wall-clock; all other planets
  scaled to their real periods relative to Mercury
  (Venus ~7.7 s, Earth ~12.5 s, Mars ~23.5 s, Jupiter ~148 s,
   Saturn ~368 s, Uranus ~1050 s, Neptune ~2060 s).
- Motion uses requestAnimationFrame, not setInterval.

LABELS
- On mouse hover over any planet, show that planet's name as text
  positioned near the planet body.
- The label must follow the planet's position while hovered (i.e. it
  doesn't lag behind as the planet moves).

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- Must run by double-clicking in a modern browser.
- No external fonts, no images, no SVG/PNG imports.
- Implementation may use either inline SVG or HTML <canvas>.
- No console errors on load.
- Total file size under 25 KB.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```
