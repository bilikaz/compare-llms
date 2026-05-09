---
difficulty: easy
checks:
  - Renders without console errors
  - Drawing area fills most of viewport, control bar visible
  - Click + drag draws a continuous line that follows the cursor
  - Releasing mouse button stops drawing (no draw on mouse-only-move)
  - At least 5 color swatches; clicking one changes the active drawing color
  - Currently selected color has a visible indicator
  - 3 brush size buttons, each producing visibly different line widths
  - Clear button erases the entire canvas (not just one stroke)
  - Layout stays usable when the window is resized
---

# Drawing Pad

A simple paint app: freehand mouse drawing on a canvas, color swatches, brush size buttons, and a clear button. Mouse drag (`mousedown` → `mousemove` → `mouseup`) is a fundamental web interaction primitive, isolated here in the simplest possible context.

A model that can't coordinate it cleanly will fail anything with sliders, draggable cards, selection rectangles, resize handles, or custom dropdowns.

## Prompt

```
Generate a single self-contained HTML file that implements a simple
drawing pad where the user draws on a canvas with their mouse.

REQUIREMENTS:
- A small control bar at the top of the page containing color swatches,
  brush size buttons, and a Clear button.
- A drawing area (HTML <canvas> or large SVG) that fills most of the
  viewport.
- White or light background for the drawing area.

MOUSE BEHAVIOR:
- Pressing the left mouse button on the drawing area and dragging
  draws a continuous line that follows the cursor.
- Releasing the mouse button stops drawing — moving the mouse with the
  button up does NOT draw.
- A click without dragging makes a single small dot at that location.
- Already-drawn strokes stay on the canvas; new strokes don't erase old ones.

COLOR PALETTE:
- At least 5 color swatches displayed as clickable squares in the
  control bar. At minimum: red, blue, green, black, yellow.
- Clicking a swatch sets the current drawing color.
- The currently selected color must have a visible indicator (e.g.
  thicker border, glow, or dot).
- Existing strokes on the canvas keep the color they were drawn with —
  changing color only affects NEW strokes.

BRUSH SIZE:
- 3 brush size buttons (small, medium, large) — for example 4, 12, and 24 px wide.
- Clicking one sets the current brush size.
- The currently selected size must have a visible indicator.
- Existing strokes keep their original size.

CLEAR:
- A Clear button that removes ALL drawing from the canvas, leaving it
  blank. The current color and brush size selections are preserved.

CONSTRAINTS:
- Single file, no external resources.
- No console errors on load.

OUTPUT:
- Return ONLY the HTML file content, starting with <!DOCTYPE html>.
- No markdown fences.
```
