# Geometric Clock Face — LLM Evaluation Rubric

A reusable scoring sheet for the "geometric clock face" code-generation
benchmark. Each row is a binary check (pass/fail) so two outputs from
different models, decoding strategies, or hardware configs can be compared
objectively.

---

## The prompt being evaluated

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders a working
analog clock made entirely of geometric shapes.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport scene (100vw x 100vh), no scrollbars.
- Plain white background.
- The clock is centered, occupies ~80% of the smaller viewport dimension,
  and stays perfectly circular when the window resizes.

CLOCK FACE
- A single black circle outline (stroke 4px, no fill) forms the clock face.
- Exactly 12 hour markers around the rim:
    * Each marker is a black rectangle, length = 5% of clock radius,
      width = 2px, oriented radially (pointing toward center).
    * Markers at 12, 3, 6, 9 must be twice as long (10% of radius).
- Exactly 60 minute markers around the rim:
    * Each is a black dot (circle, radius = 1.5px).
    * Minute markers must NOT overlap with the hour markers
      (skip the dot where an hour marker exists).

HANDS — three lines from the exact center, all with rounded line caps:
- Hour hand:    black, 6px wide,  length = 50% of radius
- Minute hand:  black, 4px wide,  length = 75% of radius
- Second hand:  red,   2px wide,  length = 90% of radius
- A black filled circle (radius 6px) covers the pivot at the center.

BEHAVIOR
- Hands point to the CURRENT system time on load.
- Second hand updates every 1 second (smooth or stepped, both fine).
- Minute and hour hands move continuously with their proper sub-rotation
  (e.g., at 3:30, the hour hand is exactly halfway between 3 and 4,
  not snapped to 3).
- Angle convention: 12 o'clock is straight up; angles increase clockwise.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- Must run by double-clicking in a modern browser.
- No external fonts, no images, no SVG/PNG imports.
- Implementation may use either inline SVG or HTML <canvas>, your choice.
- No console errors on load.
- Total file size under 15 KB.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (13 mandatory checks)

| #  | Requirement                                         | How to verify                                                              |
|----|-----------------------------------------------------|----------------------------------------------------------------------------|
| 1  | File renders without console errors                 | Open in browser, check DevTools console — must be clean                    |
| 2  | Circular black-outline clock face                   | Visual: round, not oval; outline only, no fill                             |
| 3  | Plain white background                              | Visual: pure white, no gradients, patterns, or tints                       |
| 4  | Centered, ~80% of smaller viewport dimension        | Visual: clock centered horizontally + vertically, sized appropriately      |
| 5  | Exactly 12 hour markers at 30° intervals            | Count them; check positions at 0°, 30°, 60°, ... (12 = top, increasing CW) |
| 6  | Markers at 12/3/6/9 are 2× longer than others       | Visual: cardinal markers visibly longer than the other 8                   |
| 7  | 60 minute markers as dots, not overlapping hour ticks | Zoom in between hour marks — should see 4 small dots between each pair     |
| 8  | Three distinct hands (hour, minute, second)         | Count them at the center pivot                                             |
| 9  | Correct colors: hour & minute black, second red     | Visual identification                                                      |
| 10 | Correct widths: 6 / 4 / 2 px (hour / min / sec)     | Visual: hour visibly thickest, second thinnest                             |
| 11 | Correct lengths: 50% / 75% / 90% of radius          | Visual: hour shortest, second extends nearly to rim                        |
| 12 | Black filled center pivot dot                       | Visual: small solid circle at exact center                                 |
| 13 | Hour hand interpolates with minutes                 | Check at xx:30 — hour hand sits **between** two markers, not snapped       |

**Score = sum of passes / 13.**

---

## Optional bonus checks (not required, but informative)

| Check                                              | Why it matters                                              |
|----------------------------------------------------|-------------------------------------------------------------|
| Second hand animation is smooth (rAF) vs stepped   | Smooth = uses `requestAnimationFrame`, more sophisticated   |
| Resizing the window keeps the clock circular       | Tests responsive sizing math                                |
| File size under 15 KB                              | Tests whether the model can be concise                      |
| Hands point to actual current system time on load  | Catches off-by-timezone or hardcoded-time bugs              |
| Minute-hand sub-rotation per second                | Most models snap minute to integer; bonus if continuous     |

---

## Common failure modes (what to look for)

| Mode                    | What you'll see                                              | Why it happens                                              |
|-------------------------|--------------------------------------------------------------|-------------------------------------------------------------|
| 90° rotation off        | "12" appears on the right side instead of top                | Forgot that 12 o'clock is angle −90° (or 270°)              |
| Hour hand snaps to integer | At 3:59, hour hand still points exactly at 3              | Used `hour * 30` instead of `(hour + minute/60) * 30`       |
| Minute dots overlap hour ticks | 60 dots present, but visible inside hour rectangles    | Drew all 60 without skipping the 12 hour positions          |
| Oval clock on resize    | Window resize stretches it horizontally or vertically        | Used absolute pixel sizes instead of viewport-relative      |
| Stuck second hand       | No motion at all                                             | Forgot `setInterval` / `requestAnimationFrame`              |
| Wrong direction         | Hands move counter-clockwise                                 | Got the angle sign wrong                                    |
| Markers at slight angles | Hour ticks point 5–10° off-radial                           | Forgot to rotate the marker shape itself                    |

---

## Suggested results table

For comparing two outputs (e.g. different models, decoding strategies, or
hardware configs):

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1. Renders without errors            |    ✓     |    ✓     |
| 2. Circular face                     |    ✓     |    ✓     |
| 3. White background                  |    ✓     |    ✓     |
| 4. Centered, ~80% viewport           |    ✓     |    ✓     |
| 5. 12 hour markers at 30°            |    ✓     |    ✓     |
| 6. 12/3/6/9 are 2× longer            |    ✓     |    ✗     |
| 7. 60 minute dots                    |    ✓     |    ✗     |
| 8. Three hands                       |    ✓     |    ✓     |
| 9. Correct colors                    |    ✓     |    ✓     |
| 10. Correct widths                   |    ✓     |    ✓     |
| 11. Correct lengths                  |    ✓     |    ✓     |
| 12. Center pivot dot                 |    ✓     |    ✓     |
| 13. Hour interpolates                |    ✓     |    ✓     |
| **Total**                            | **13/13**| **11/13**|

Bonus checks:
- Smooth second hand:                       Yes / No
- Stays circular on resize:                 Yes / No
- File size:                                 X KB / Y KB
- Wall-clock generation time:                X.Xs / Y.Ys
- Tokens generated:                          X / Y
- Tok/s:                                     X / Y
```

---

## Combined metric: useful throughput

Raw tok/s alone hides quality differences. A more honest metric:

```
useful_tok_per_sec = tokens_per_sec * (rubric_score / 13)
```

Example:

| Model     | tok/s  | Rubric  | Useful tok/s |
|-----------|--------|---------|--------------|
| MTP       | 75.2   | 13/13   | 75.2         |
| DFLASH    | 74.7   | 11/13   | 63.2         |

Same speed bracket → 19% real-world delta once correctness is folded in.

---

## Difficulty tiers (variants of the same task)

**Tier 1 (this rubric)** — Bare clock face, 13 checks above.

**Tier 2 (medium)** — Add Roman numerals (I, II, III, ... XII) at hour
positions, drawn as text shapes oriented radially. Adds 3 checks:
correct numerals present, correct positioning, readable orientation.

**Tier 3 (hard)** — Replace clock with a working gear train: three
meshing gears of different tooth counts (e.g., 12 / 20 / 30), rotating at
correct relative speeds, gears actually meshing without overlap or gap.
Tests gear-ratio math + tooth geometry + radial layout. Most models fail.

---

## Notes for benchmarking workflow

- **Run 3+ rounds per config** and take median rubric score — single runs
  have variance from sampling.
- **Use the same seed / temperature** across compared runs to isolate the
  variable you're testing (decoding strategy, quantization, etc.).
- **Save the raw HTML output** alongside the screenshot — useful for
  later automated re-scoring or regression testing.
- **Score visually first**, then optionally write a Puppeteer/Playwright
  script for automated rubric checking (counting markers, measuring
  hand angles, etc.) once you have a stable rubric.