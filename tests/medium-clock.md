---
difficulty: medium
checks:
  - label: File renders without console errors
    verify: Open in browser, check DevTools console — must be clean
  - label: Circular black-outline clock face
    verify: "Visual: round, not oval; outline only, no fill"
  - label: Plain white background
    verify: "Visual: pure white, no gradients, patterns, or tints"
  - label: Centered, ~80% of smaller viewport dimension
    verify: "Visual: clock centered horizontally + vertically, sized appropriately"
  - label: Exactly 12 hour markers at 30° intervals
    verify: "Count positions at 0°, 30°, 60°, … (12 = top, increasing CW)"
  - label: Markers at 12/3/6/9 are 2× longer than others
    verify: Cardinal markers visibly longer than the other 8
  - label: 60 minute markers as dots, not overlapping hour ticks
    verify: Zoom in between hour marks — should see 4 small dots between each pair
  - label: Three distinct hands (hour, minute, second)
    verify: Count them at the center pivot
  - label: "Correct colors: hour & minute black, second red"
    verify: Visual identification
  - label: "Correct widths: 6 / 4 / 2 px (hour / min / sec)"
    verify: Hour visibly thickest, second thinnest
  - label: "Correct lengths: 50% / 75% / 90% of radius"
    verify: Hour shortest, second extends nearly to rim
  - label: Black filled center pivot dot
    verify: Small solid circle at exact center
  - label: Hour hand interpolates with minutes
    verify: At xx:30 the hour hand sits between two markers, not snapped
  - label: Second hand animation is smooth (rAF), not stepped
    verify: Smooth = uses requestAnimationFrame
  - label: Hands point to current system time on load
    verify: Compare against your system clock — catches hardcoded times
  - label: Minute hand has continuous sub-rotation (not snapped to integers)
    verify: Watch for ~10 s — minute hand should creep, not jump
  - label: Layout stays usable when the window is resized
    verify: Resize the browser — clock stays round and centered, no clipping or scrollbars
---

# Geometric Clock Face

A live geometric analog clock face, made entirely of shapes. Tests radial geometry (12 hour markers, 60 minute dots, three hands of correct length and color), trig math, real-time tick, and continuous sub-rotation of the hour and minute hands.

Mostly binary checks so two outputs from different models, decoding strategies, or hardware configs can be compared objectively.

## Prompt

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
