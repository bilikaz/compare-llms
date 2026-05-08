# Drawing Pad

Addition to the **Primitive LLM Benchmark Suite**. Covers the biggest
gap in the easy suite: **mouse drag interaction**. None of the other
7 easy tests test this — tic-tac-toe is single clicks, the maze is
keyboard, the grid editor is single-cell toggles.

To integrate: append to `primitive-llm-benchmark-suite.md` as Test 8,
update combined scoring divisor from `/56` (8 × 7) to `/64` (8 × 8).

---

# Drawing Pad

A simple paint app where the user can draw freehand on a canvas with
their mouse. Tests `mousedown` / `mousemove` / `mouseup` state
coordination, color and size selection, and canvas clearing.

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

## Rubric (8 checks)

| # | Requirement                                                    |
|---|----------------------------------------------------------------|
| 1 | Renders without console errors                                 |
| 2 | Drawing area fills most of viewport, control bar visible       |
| 3 | Click + drag draws a continuous line that follows the cursor   |
| 4 | Releasing mouse button stops drawing (no draw on mouse-only-move) |
| 5 | At least 5 color swatches; clicking one changes the active drawing color |
| 6 | Currently selected color has a visible indicator               |
| 7 | 3 brush size buttons, each producing visibly different line widths |
| 8 | Clear button erases the entire canvas (not just one stroke)    |

## How to verify each check

- **#3** — Click and hold, drag in a wavy motion. The line must follow
  the cursor smoothly, not appear as disconnected dots or a single
  straight segment from start to release point.
- **#4** — Move the mouse over the canvas WITHOUT pressing any button.
  Nothing should be drawn. Then press, drag, release. Then move again
  with no button — still nothing.
- **#5–6** — Click each color swatch in turn, draw a stroke after each.
  Each new stroke should match the most recently selected color.
  Selected swatch should look distinct.
- **#7** — Pick small, draw a line. Pick large, draw another line.
  The large line should be visibly thicker (~3–6× wider).
- **#8** — Draw a few strokes in different colors, click Clear. Canvas
  must be completely blank.

## Common failures

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| **Disconnected dots**             | Drag draws scattered dots instead of a smooth line    | No line interpolation; only `mousemove` event positions     |
| **Straight segments only**        | Drag from A to B draws a straight line A→B            | Only handled `mousedown` start + `mouseup` end              |
| **Draws on hover**                | Mouse over the canvas paints without clicking         | Forgot `isDrawing` flag; draws every mousemove unconditionally |
| **Doesn't stop on mouseup**       | Once drawing starts, it never stops                   | No `mouseup` handler                                         |
| **Stops when leaving canvas**     | Drag off canvas + back resumes drawing wrong          | Only listened on canvas; missed `mouseup` outside it        |
| **Color change repaints all**     | Changing color recolors existing strokes              | Stored a single global color, redrew everything each frame   |
| **Brush size doesn't change**     | All lines are the same width                          | Variable updated but `lineWidth` not actually read           |
| **Clear removes only last stroke**| Clear acts like undo                                  | Confused "clear" with "undo last action"                    |
| **Selected color/size invisible** | No way to tell what's active                          | Forgot the selected-state styling                            |
| **Single dot click doesn't work** | Click without drag does nothing                       | Drawing logic only fires on `mousemove`                     |
| **Right-click draws too**         | Spec said left-button; model didn't filter            | Used `mousedown` without checking `event.button === 0`      |
| **Canvas resizing breaks drawing**| Window resize blanks the canvas mid-draw              | Canvas recreated on resize without preserving content        |

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1. No console errors                 |    ✓     |    ✓     |
| 2. Canvas + control bar              |    ✓     |    ✓     |
| 3. Click+drag draws continuous line  |    ✓     |    ✗     |
| 4. Releases mouse → stops drawing    |    ✓     |    ✗     |
| 5. ≥5 color swatches work            |    ✓     |    ✓     |
| 6. Selected color indicator          |    ✓     |    ✗     |
| 7. 3 brush sizes give different widths |   ✓     |    ✓     |
| 8. Clear empties canvas              |    ✓     |    ✓     |
| **Total**                            | **8/8**  | **5/8**  |
```

In the example above, Output B has the **classic missing-state-machine
bug** — model handled mousedown to start drawing but never properly
handled mouseup, so the line keeps drawing as you move. Combined with
"no selected color indicator" this is a model that wrote the basic
shape of a paint app but skipped the polish.

## Updated combined scoring for the easy suite

With Test 8 added:

```
easy_suite_score = total_passes / (8 * 8)
                 = total_passes / 64
useful_tok_per_sec = avg_tok_per_sec * easy_suite_score
```

A model scoring 48+/64 (75%) is ready for the hard suite. Under 32/64
(50%), stay easy.

## Why this fills a gap

| Capability                           | Existing easy tests cover it? | Test 8 adds |
|--------------------------------------|:-----------------------------:|:-----------:|
| Static layout                        |              ✅               |      —      |
| Factual recall                       |              ✅               |      —      |
| Basic physics                        |              ✅               |      —      |
| Particle effects                     |              ✅               |      —      |
| Grid + click toggle                  |              ✅               |      —      |
| Keyboard + collision                 |              ✅               |      —      |
| Turn-based game logic                |              ✅               |      —      |
| **Mouse drag (mousedown→move→up)**   |              —                |     ✅      |
| **Active state indicator (UI)**      |              —                |     ✅      |
| **Continuous line drawing**          |              —                |     ✅      |
| **Toolbar / palette pattern**        |              —                |     ✅      |

Mouse drag is a fundamental web interaction primitive. A model that
can't coordinate `mousedown` / `mousemove` / `mouseup` properly will
fail many real-world tasks: anything with sliders, draggable cards,
selection rectangles, resize handles, custom dropdowns, etc.

This test isolates that one skill in the simplest possible context.

## Notes for benchmarking

- **Manually drag a wavy line** when scoring #3. Don't just verify
  "something drew" — check that the line actually follows the cursor
  path, not dots/segments.
- **Test mouse-leave-canvas-while-drawing**: many models break here.
  This isn't in the rubric (it's a bonus check) but it's worth noting
  if the model handles it correctly.
- **3 rounds is enough** at this difficulty.
- **This test catches a specific weakness**: models trained mostly on
  data that uses click events but not drag events. Useful for
  separating "knows web fundamentals" from "knows how to write
  click handlers."

## Bonus checks (optional)

| Check                                                  | Why it matters                                              |
|--------------------------------------------------------|-------------------------------------------------------------|
| Drawing continues smoothly when cursor leaves and re-enters canvas while button held | Tests `mouseup` listener on document, not canvas |
| Touch events also work (tap + drag on touchscreen)     | Bonus mobile support                                        |
| "Undo last stroke" button or Ctrl+Z                    | Bonus state history                                         |
| Eraser tool (white brush or actual erase mode)         | Bonus mode-switching                                        |
| Cursor changes to crosshair over canvas                | Bonus UX polish                                             |

---

**Easy suite is now 8 tests / 64 checks total**, covering: static layout,
factual recall, physics, particles, grid editing, keyboard navigation,
turn-based game logic, and mouse drag. That's a comprehensive screen
for whether a model has basic web-app fluency before you commit to the
full hard suite.