# SVG Underwater Scene — Lightweight Boss Test

A lighter alternative to the SVG Pasture test. Same skill axis (visual
reasoning over SVG primitives, recognizable subjects, scene composition,
animation) but at roughly **one-quarter the output size**.

## Why this exists

The pasture test is brutal because of token cost:
- 4 mammals × ~12 SVG parts each = 48 elements just for animals
- Plus clouds, trees, sun, sky = ~80 elements total
- Final files are typically 25–40 KB
- Generation takes 60–180 seconds on most models
- Speeds drop ~30% vs the medium tests

This test trades a few skill axes for huge output savings:
- **Fish have no legs** — biggest single saving (no leg-count failures, no leg-count drama, but also no leg-count diagnostic)
- **Bubbles** are just circles (cheapest possible "object")
- **Seaweed** is one wavy line each (vs trees with trunk + canopy)
- **2 subjects** instead of 4
- **No grounding constraint** for fish (they swim, not stand)

You lose the iconic "two-legged sheep" diagnostic, but you keep the core
test: can the model construct subjects that are recognizable as fish
without being labeled, and compose them into a coherent scene?

Use this when:
- Pasture is too expensive (large suite runs, many model variants)
- You want fast SVG signal (~3× faster generation)
- You're sanity-checking before committing to the full pasture run
- Generation budget per round is limited

---

## The prompt

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

---

## Scoring rubric (15 mandatory checks)

### Scene structure (4 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 1  | Renders without console errors                           |
| 2  | Water gradient visible (lighter top → darker bottom)     |
| 3  | Visible seafloor along the bottom                        |
| 4  | At least 2 seaweed/plants rooted on the seafloor         |

### Fish #1 (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 5  | Fish #1 has body + triangular tail + ≥1 fin + 1 eye + mouth |
| 6  | Fish #1 is recognizable as a fish without a label        |
| 7  | Fish #1 swims (moves horizontally with screen wrap)      |

### Fish #2 (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 8  | Fish #2 has body + triangular tail + ≥1 fin + 1 eye + mouth |
| 9  | Fish #2 is visibly different from Fish #1 (size, color, AND shape) |
| 10 | Fish #2 swims at a noticeably different speed than Fish #1 |

### Bubbles (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 11 | At least 5 bubbles visible at any given time             |
| 12 | Bubbles rise upward continuously                         |
| 13 | Bubbles wrap (disappear at top, respawn near seafloor)   |

### Composition (2 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 14 | Both fish wrap around the screen correctly (don't get stuck or vanish) |
| 15 | Scene reads as "underwater" at a glance (gestalt)        |

**Score = passes / 15.**

---

## Optional bonus checks

| Check                                                     | Why it matters                                              |
|-----------------------------------------------------------|-------------------------------------------------------------|
| Fish bodies have stripes, spots, or pattern detail        | Bonus visual richness                                       |
| Seaweed sways gently                                      | Bonus animation                                             |
| Bubble sizes vary realistically (small + large)           | Bonus realism                                               |
| Bubbles wobble side-to-side as they rise                  | Bonus realism                                               |
| Fish bodies have subtle wobble while swimming             | Bonus liveliness                                            |
| 3+ fish instead of 2                                      | Bonus complexity                                            |
| Fish facing the direction they swim (mirroring on wrap)   | Tests transform handling                                    |
| Light rays from the surface (faint diagonal beams)        | Bonus atmosphere                                            |
| File size under 18 KB                                     | Conciseness                                                 |
| Smooth animation throughout (no stutter)                  | Performance                                                 |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| **Fish are blobs**                | Can't tell they're fish without label                 | No tail / fin / eye distinction; just an oval               |
| **Fish swim backwards**           | Fish moves left but tail is on the left side too      | Forgot to mirror tail when fish faces a direction           |
| **Both fish identical**           | Same color, size, and shape                           | Spec said "visually distinct" — model used same template    |
| **Fish don't swim**               | Static scene with bubbles only                        | Animation forgotten                                         |
| **Fish swim once and stop**       | One pass across screen, then nothing                  | No wrap; just translate animation that runs once            |
| **Fish have legs** (rare but funny)| Yes this happens. Generic "animal" template       | Model defaulted to quadruped from training                  |
| **Bubbles don't rise**            | Static dots                                           | Animation forgotten                                         |
| **Bubbles rise once, never again**| Initial bubbles rise then screen clears               | No respawn loop                                             |
| **All bubbles same size**         | Repetitive look                                       | Used one constant radius                                    |
| **No seafloor**                   | Background is just water all the way down             | Skipped the seafloor requirement                            |
| **Seaweed floats above floor**    | Plants in mid-water                                   | Same grounding bug as floating animals in pasture           |
| **No water gradient**             | Solid blue background                                 | Used `fill="blue"` instead of `linearGradient`              |
| **Two fish at same speed**        | Spec said different speeds                            | Used same animation duration                                |
| **Used emoji**                    | 🐠 instead of constructed SVG                         | Took shortcut — instant fail                                |

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Water gradient                   |    ✓     |    ✗     |
| 3.  Seafloor                         |    ✓     |    ✓     |
| 4.  ≥2 seaweed                       |    ✓     |    ✓     |
| 5.  Fish #1 anatomy complete         |    ✓     |    ✓     |
| 6.  Fish #1 recognizable             |    ✓     |    ✓     |
| 7.  Fish #1 swims                    |    ✓     |    ✓     |
| 8.  Fish #2 anatomy complete         |    ✓     |    ✗     |
| 9.  Fish #2 distinct from #1         |    ✓     |    ✗     |
| 10. Different swim speeds            |    ✓     |    ✓     |
| 11. ≥5 bubbles                       |    ✓     |    ✓     |
| 12. Bubbles rise                     |    ✓     |    ✓     |
| 13. Bubbles wrap/respawn             |    ✓     |    ✗     |
| 14. Both fish wrap correctly         |    ✓     |    ✓     |
| 15. Reads as underwater (gestalt)    |    ✓     |    ✓     |
| **Total**                            | **15/15**| **11/15**|

Bonus:
- Bubble sizes vary:               Yes / No
- Fish face swim direction:        Yes / No
- File size:                       X KB / Y KB
```

In the example above, Output B has the classic "second fish is a copy
of the first" failure plus "bubbles don't loop" — both common shortcuts
when the model is running long on output budget.

---

## Why this is a good lighter alternative

| Property                          | Pasture (full)         | Underwater (light)     |
|-----------------------------------|------------------------|------------------------|
| SVG element count                 | ~80                    | ~20–25                 |
| Typical file size                 | 25–40 KB               | 8–18 KB                |
| Generation time (rough)           | 60–180 s               | 20–60 s                |
| Number of subjects                | 4 mammals              | 2 fish                 |
| Anatomy parts per subject         | ~12 (body, 4 legs, etc.) | ~5 (body, tail, fin, eye, mouth) |
| Leg-count diagnostic              | Yes (★ checks)         | No (fish don't have legs) |
| Recognition test                  | Yes                    | Yes                    |
| Scene composition test            | Yes                    | Yes                    |
| Animation test                    | Yes (bouncing)         | Yes (swimming + bubbles) |
| Grounding test                    | Yes (animals on grass) | Partial (seaweed only) |
| Total rubric checks               | 20                     | 15                     |

**You lose** the leg-count diagnostic and the grounding-of-mammals test.
**You keep** the recognizability requirement, scene composition, animation,
and color/shape/size differentiation.

---

## Use it standalone OR as a screening test before pasture

**Standalone**: if you don't need the full pasture, run this as a single
boss test for SVG visual reasoning. Lighter on tokens, faster turnaround,
still produces clear signal.

**Screening**: run this first on every model. If a model scores ≥ 12/15
on underwater, it's worth running pasture. If it scores ≤ 8/15, pasture
will produce the same low score for 3× the cost.

---

## Combined suite metric (with this added)

If you replace pasture with underwater for cost reasons:

```
suite_score = (clock/13 + orrery/15 + sandbox/15 + fireworks/15
             + life/15 + maze/15 + underwater/15) / 7
```

If you keep both as separate tests (sanity check + boss):

```
suite_score = (clock/13 + orrery/15 + sandbox/15 + fireworks/15
             + life/15 + maze/15 + underwater/15 + pasture/20) / 8
```

The underwater score correlates strongly with pasture for most models
(~0.85 correlation in informal testing), so it's a reasonable proxy when
you can't afford the full pasture run.

---

## Variants for harder difficulty

**Tier 2 (medium-hard)** — Add:
- A treasure chest on the seafloor (closed lid, gold trim).
- 3+ fish instead of 2, including one "different" creature
  (octopus, jellyfish, crab — model picks).
- Bubbles wobble side-to-side as they rise.
4 extra checks.

**Tier 3 (hard)** — Add:
- A submarine with porthole and propeller (animated propeller spin).
- Day/night cycle: water color shifts over a 30-second loop.
- Fish school behavior: 5 fish that move as a loose group.
- Predator/prey: when the larger fish gets close to the smaller one,
  the smaller one darts away.
This tier adds simple AI/behavior to the visual test. Most models flunk
the "darts away" requirement.

---

## Notes for benchmarking workflow

- **1–2 rounds is enough** for this task. Like pasture, variance is
  mostly in binary "did it draw a recognizable fish" outcomes.
- **Score visually** — auto-grading is impractical for "is this a fish?"
- **Shrink the screenshot to 200×150** when judging gestalt (#15) — if
  it still reads as underwater at thumbnail size, the model nailed it.
- **Save raw SVG output** for the archive. Good fish make good showcase
  examples; bad fish make good memes (the "this is just an oval with
  one fin" school of fish art).
- **Track average file size across models** — efficient SVG output is
  itself a signal. A model that produces a great scene in 8 KB is
  doing better thinking than one that needs 16 KB for the same result.

---

## A note on what we lose

The two-legged sheep is gone. The five-legged cow is gone. The
universally beloved "model has clearly never thought about anatomy"
diagnostic of the pasture test does not exist for fish.

Fish are forgiving. They have one body, one tail, one eye, and you're
done. This makes underwater the *kinder* test — but also the less
diagnostic one. If you want the brutal anatomical reality check, run
pasture. If you want the same skill axis with 1/3 the token cost, run
this.

The patron sheep of summer 2026 still presides over the suite. May the
fish join in due course, with appropriate fins.