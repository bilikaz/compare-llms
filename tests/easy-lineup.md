---
difficulty: easy
checks:
  - Renders without console errors
  - Black background
  - Sun present, visibly larger than every planet
  - Exactly 8 planets present
  - Planets in correct order from sun outward
  - Planet names labeled below each body
  - Jupiter visibly biggest planet, Mercury visibly smallest
  - At least 4 planet colors approximately right (Mars red, Earth blue, etc.)
  - Saturn has visible rings (ellipse / line crossing the planet)
  - Layout stays usable when the window is resized
---

# Solar System Lineup

Mirror of the **Solar System Orrery**, stripped to a static horizontal line-up of the sun and the 8 planets. Tests factual recall: planet order, relative sizes, colors, and Saturn's identifying ring. No orbits, no animation, no moons, no hover.

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
- Saturn must have a visible ring drawn around it (a thin ellipse, or a
  horizontal line / band crossing the planet body).
- All bodies arranged in a single horizontal row.

CONSTRAINTS:
- Single file, no external resources.
- No animation.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
