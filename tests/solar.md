# Solar System Orrery — LLM Evaluation Rubric

A second benchmark task in the same family as the geometric-clock rubric.
Tests a different skill set: proportional sizing, color identity from
training knowledge, orbital ratio math, hover state, and layered animation.

Pair this with the clock test for a 2-task suite.

---

## The prompt

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

---

## Scoring rubric (15 mandatory checks)

| #  | Requirement                                            | How to verify                                                |
|----|--------------------------------------------------------|--------------------------------------------------------------|
| 1  | File renders without console errors                    | DevTools console clean on load                               |
| 2  | Black background                                       | Visual                                                       |
| 3  | At least 50 visible stars (spec asks 100, allow some leniency) | Count or visual density check                        |
| 4  | Sun centered, yellow/orange, larger than every planet  | Visual                                                       |
| 5  | Sun has glow / halo effect                             | Visual: gradient or lighter ring around it                   |
| 6  | Exactly 8 planets present                              | Count                                                        |
| 7  | Planets in correct order from sun outward              | Mercury → Neptune sequence                                   |
| 8  | All orbits are concentric circles centered on sun      | Visual: no offset orbits, no ovals (Saturn ring excepted)    |
| 9  | Orbit paths are visible                                | Faint white circles must be drawn                            |
| 10 | Planet colors approximately match real appearance      | Mars red, Earth blue, Jupiter tan, Neptune deep blue, etc.   |
| 11 | Jupiter is the largest planet, Mercury the smallest    | Visual: sizes correctly ordered                              |
| 12 | Saturn has visible rings                               | Visual: tilted ellipse around Saturn                         |
| 13 | Earth has a moon orbiting it                           | Visual: small gray body circling Earth                       |
| 14 | All planets orbit in the same direction (counter-clockwise) | Watch motion for a few seconds                          |
| 15 | Inner planets visibly faster than outer planets        | Mercury laps Neptune within a few seconds                    |

**Score = passes / 15.**

---

## Optional bonus checks

| Check                                               | Why it matters                                                |
|-----------------------------------------------------|---------------------------------------------------------------|
| Hover label appears and follows the planet           | Tests pointer + animation interaction                         |
| Animation is smooth (`requestAnimationFrame`)        | Stepped motion suggests `setInterval`                         |
| Earth's moon orbits faster than Earth's own orbit    | Tests nested-frame thinking                                   |
| Jupiter has visible bands/stripes (not flat color)   | Bonus visual fidelity                                         |
| Stars are at varied brightness (not all white)       | Spec said 30–100% — easy to miss                              |
| File size under 25 KB                                | Conciseness check                                             |
| Stars don't render on top of planets                 | Tests z-order awareness                                       |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                         |
|-----------------------------------|-------------------------------------------------------|--------------------------------------------------------|
| Only 7 planets                    | A planet missing (often Uranus or Neptune)            | Off-by-one in loop, or model forgets one              |
| Wrong order                       | Earth inside Venus, or Mars outside Jupiter           | Lazy alphabetical or random listing                    |
| All planets same size             | Jupiter same diameter as Mercury                      | Used a single radius variable for all                  |
| All planets same speed            | Outer planets keep up with Mercury                    | Forgot to scale angular velocity by orbit              |
| Mixed orbit directions            | Some clockwise, some counter-clockwise                | Random sign on angle increments                        |
| No rings on Saturn                | Saturn looks like Uranus                              | Skipped the special case                               |
| No moon on Earth                  | Earth is alone                                        | Skipped the special case                               |
| Wrong colors                      | Purple Earth, green Mars, blue Sun                    | Model got real-world colors wrong                      |
| Stars overlap planets             | White dots showing through Jupiter                    | Drew stars after planets, or wrong z-order             |
| Square / non-circular orbits      | Visible polygon shape on outer planets                | Used too few segments in path                          |
| Hover doesn't work                | No label appears on mouseover                         | Forgot pointer events or didn't bind handler           |
| Hover label lags behind planet    | Label appears, but stays still while planet moves     | Updated label position only on mouseenter, not in rAF  |
| Saturn rings move independently   | Rings stay put while Saturn orbits                    | Ring position not parented to Saturn's transform       |

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Black background                 |    ✓     |    ✓     |
| 3.  ≥50 stars                        |    ✓     |    ✗     |
| 4.  Sun centered, yellow, largest    |    ✓     |    ✓     |
| 5.  Sun has glow                     |    ✓     |    ✗     |
| 6.  Exactly 8 planets                |    ✓     |    ✓     |
| 7.  Correct order outward            |    ✓     |    ✓     |
| 8.  Orbits concentric circles        |    ✓     |    ✓     |
| 9.  Orbit paths visible              |    ✓     |    ✓     |
| 10. Colors approximately right       |    ✓     |    ✓     |
| 11. Jupiter biggest, Mercury smallest|    ✓     |    ✓     |
| 12. Saturn has rings                 |    ✓     |    ✗     |
| 13. Earth has moon                   |    ✓     |    ✗     |
| 14. Same orbit direction             |    ✓     |    ✓     |
| 15. Inner faster than outer          |    ✓     |    ✓     |
| **Total**                            | **15/15**| **11/15**|

Bonus:
- Hover labels work:                Yes / No
- Smooth animation (rAF):           Yes / No
- Moon orbits faster than Earth:    Yes / No
- Jupiter bands visible:            Yes / No
- File size:                        X KB / Y KB
```

---

## Why this complements the clock test

The two tests deliberately exercise different model strengths:

| Capability                   | Clock | Orrery |
|------------------------------|:-----:|:------:|
| Radial / angular geometry    |  ✅   |   ✅    |
| Time / current state binding |  ✅   |   —    |
| Proportional sizing math     |  —    |   ✅    |
| Real-world factual recall (colors, order) | — | ✅ |
| Special-case handling (Saturn rings, Earth moon) | — | ✅ |
| Smooth animation             |  ✅   |   ✅    |
| Pointer / hover interaction  |  —    |   ✅    |
| Z-order layering             |  —    |   ✅    |
| Nested coordinate frames (moon orbits Earth which orbits Sun) | — | ✅ |

Models that ace the clock can still fail the orrery on facts (color/order)
or special cases (rings, moon), and vice versa. Run both for a fuller
picture than either alone.

---

## Combined "useful tok/s" across the suite

When running both tests, average the rubric scores before multiplying:

```
suite_score = (clock_score / 13 + orrery_score / 15) / 2
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

This rewards models that are consistent across task types, not ones
that ace one and tank the other.

---

## Variants for harder difficulty

**Tier 2 (medium)** — Add a "speed" control: a slider 0.1× to 10× that
scales all orbital velocities proportionally in real time. Adds 3 checks:
slider visible, real-time response, all planets scale together.

**Tier 3 (hard)** — Inclined orbits + perspective: each planet's orbit
tilted at a small unique angle (rendered as ellipses), planets visibly
"in front of" or "behind" the sun depending on orbit phase, with
opacity or size shift to imply depth. Tests 3D-on-2D projection math.
Most models will fail.

---

## Notes for benchmarking workflow

- **3+ rounds per config**, take median rubric score.
- **Same seed and temperature** across compared runs.
- **Save raw HTML output** alongside screenshots for re-scoring later.
- **Time the model from prompt sent → first DOCTYPE token** (latency)
  separately from total generation time (throughput). Both matter for
  real-world UX.
- For automated scoring: a Puppeteer script can count `<circle>` elements
  for planets, check fill colors against expected palette, verify order
  by comparing `cx` / orbit radius, and detect rings/moon by counting
  child elements on Saturn / Earth groups.