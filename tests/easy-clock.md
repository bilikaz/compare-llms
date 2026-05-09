---
difficulty: easy
checks:
  - Renders without console errors
  - Circular clock face visible
  - At least 12 hour markers around the rim
  - Three distinct hands present
  - Hour hand points to "10" (upper-left direction)
  - Minute hand points to "2" (upper-right direction)
  - Second hand is red, hour and minute hands are black
  - Center pivot dot present
  - Layout stays usable when the window is resized
---

# Static Analog Clock at 10:10

Mirror of the **Geometric Clock** rubric, stripped to a static 10:10 face — no time-current binding, no animation, no minute markers. Tests basic geometry and trig: can the model place hour markers around a circle and aim two hands at the right angles?

(10:10 is the time used in clock advertising worldwide — both hands point up-and-out, making the clock look like a smile.)

## Prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports) that displays a static analog clock face
showing the time 10:10.

REQUIREMENTS:
- A circular clock face centered on the page, ~400 px diameter, black outline.
- 12 hour markers around the rim as small lines or dots.
- Three clock hands all originating from the exact center:
    * Hour hand: black, thicker, pointing at the "10" position
      (i.e., toward upper-left).
    * Minute hand: black, thinner, pointing at the "2" position
      (i.e., toward upper-right) — this gives the 10:10 "smile" look.
    * Second hand: red, thinnest, pointing straight up toward "12".
- A small black dot at the exact center where the hands meet.

CONSTRAINTS:
- Single file. No external resources.
- No animation needed — entirely static.
- SVG or canvas, your choice.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences, no commentary.
```
