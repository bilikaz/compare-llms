# SVG Pasture Scene — LLM Boss-Level Evaluation Rubric

The hardest test in the suite. Tests something the other tasks can't:
**spatial reasoning over SVG primitives**. Models must construct
recognizable animals (cow, sheep, pig, etc.) and a coherent scene from
nothing but `<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, `<path>`,
and `<line>`. No emoji, no images, no text-as-graphics, no clip-art
imports.

This is where most models humiliate themselves. Common failures include
sheep with one eye and two legs, cows with five legs, pigs that look
like blobs, and trees that float in mid-air. If a model can construct
8 different animals from primitives that an actual human can identify
without labels, it has genuinely strong spatial reasoning.

Pair as a stretch goal after the 6-task suite. Most frontier-class models
will score 60–80%. Mid-tier models will score 20–40%. Small / quantized
models will score below 20%. The signal is wide.

---

## The prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an animated
pasture scene with bouncing animals, made entirely from SVG primitives.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport SVG (100vw x 100vh), no scrollbars.
- A sky gradient background (light blue at top, transitioning to lighter
  blue/white near the horizon) covering the upper ~65% of the viewport.
- A grass area (green, optionally with subtle texture or gradient) covering
  the lower ~35%, with a clear horizon line where they meet.

SUN
- A yellow circle in the upper portion of the sky.
- Surrounded by a lighter yellow halo / glow.
- At least 6 ray lines or triangles emanating outward from the sun.

CLOUDS
- At least 3 clouds drifting slowly across the sky from one side to the other.
- Each cloud is constructed from 3+ overlapping circles or ellipses
  (white or off-white) — NOT a single shape.
- Clouds wrap around: when a cloud exits one side, it reappears on the other.

TREES
- At least 2 trees rooted firmly on the grass (NOT floating in the sky
  or buried in the ground).
- Each tree has:
    * A brown trunk (rectangle or tapered shape).
    * A green canopy (cluster of overlapping circles, or a single large
      shape — your choice, but it must look tree-like, not a green blob
      on a brown stick).
- Trees may sway gently OR remain static — your choice.

ANIMALS — exactly 4 distinct species, all visible at once:

For each animal you must construct it from SVG primitives only. NO emoji,
NO Unicode characters as graphics, NO external images. Each animal must be
RECOGNIZABLE as its species WITHOUT a text label — i.e. a person glancing
at the scene should be able to say "that's a sheep, that's a cow."

Required species and their non-negotiable identifying features:

  COW
    - Body: white/cream with at least 3 black patches/spots.
    - Exactly 4 legs visible (this is critical — count them).
    - 2 horns or 2 small ears on the head.
    - 2 eyes.
    - A pink udder OR a pink nose (cow-defining feature).

  SHEEP
    - Body: fluffy white (use multiple overlapping circles/ellipses to
      suggest wool — NOT a single smooth oval).
    - Exactly 4 dark legs visible.
    - A dark face (gray or black).
    - 2 eyes.
    - 2 ears.

  PIG
    - Body: pink, mostly oval/round.
    - Exactly 4 legs visible.
    - Pink snout (a small oval at the front of the face) with 2 nostrils.
    - 2 small triangular ears.
    - 2 eyes.
    - A small curly tail (a curved path).

  HORSE
    - Body: brown, longer than tall.
    - Exactly 4 legs visible (longer than the cow/sheep/pig legs).
    - Long neck.
    - Visible mane (darker line/shape along the neck).
    - 2 ears.
    - 2 eyes.
    - A tail at the rear.

GENERAL ANIMAL RULES (apply to all 4):
- All 4 animals must be drawn standing on the grass, not floating.
- Animals must be roughly proportional to each other (a horse is not the
  same size as a pig).
- No overlapping animals on top of each other; spaced across the field.
- Each animal must have a clearly visible head/face turned toward the
  viewer or in profile.

ANIMATION
- All 4 animals must "bounce" in place — a gentle vertical hop loop
  (e.g., 0.5–1 second period, ~10–20 px amplitude). They do not
  translate horizontally.
- Each animal's bounce should be slightly out of phase with the others
  (offset start times) so they don't all bounce in sync.
- Bouncing uses CSS keyframe animations or SMIL `<animate>` — your choice.
- Clouds drift continuously as specified above.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no fetch, no network access.
- No emoji, no Unicode pictographs (🐄🐷🐎🐑 etc.), no foreignObject text
  used as graphics. Animals must be SVG primitives only.
- No external fonts; system stack is fine for any text (e.g. labels are
  not required, but if you add them, system fonts only).
- Total file size under 30 KB.
- No console errors on load.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (20 mandatory checks)

Higher check count than the other rubrics because the scene is denser
and there are more individual things to get right.

### Scene structure (5 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 1  | Renders without console errors                           |
| 2  | Sky gradient + grass area both visible, with clear horizon |
| 3  | Sun present with halo AND ≥6 visible rays                |
| 4  | ≥3 clouds, each made of 3+ overlapping shapes (not a single oval) |
| 5  | Clouds animate (drift across sky, wrap around)           |

### Trees (2 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 6  | ≥2 trees with clearly distinguishable trunk + canopy     |
| 7  | Trees rooted on grass (NOT floating, NOT buried)         |

### Cow (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 8  | **Cow has exactly 4 legs** ★                             |
| 9  | Cow has visible black-and-white patching                 |
| 10 | Cow has 2 eyes AND a pink feature (udder or nose)        |

### Sheep (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 11 | **Sheep has exactly 4 legs** ★                           |
| 12 | Sheep has fluffy/multi-shape wool body (not single oval) |
| 13 | Sheep has a dark face with 2 visible eyes                |

### Pig (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 14 | **Pig has exactly 4 legs** ★                             |
| 15 | Pig has a visible snout with 2 nostrils                  |
| 16 | Pig has a curly tail (curved path, not straight)         |

### Horse (3 checks)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 17 | **Horse has exactly 4 legs** ★                           |
| 18 | Horse has a visible mane along the neck                  |
| 19 | Horse has a tail at the rear                             |

### Animation + spatial coherence (1 check)

| #  | Requirement                                              |
|----|----------------------------------------------------------|
| 20 | All 4 animals bounce, with phase offsets so they aren't all synced |

★ = the **leg count** checks. These are the most diagnostic in the entire
suite. Models that fail these almost universally fail because they're
generating SVG by template-pattern, not by reasoning about anatomy.

**Score = passes / 20.**

---

## The leg count check is the headline metric

If you only have time to check one thing per animal, count the legs.
A **profile-view** quadruped should show all 4 legs (or at minimum
both pairs distinguishable), even though in real life two legs are
behind the others — SVG conventions show all 4.

Common screwups:

| Pattern                     | Cause                                                  |
|-----------------------------|--------------------------------------------------------|
| **Sheep with 2 legs**       | Model treated sheep as "fluffy circle on stick legs"; only drew the visible pair |
| **Cow with 5 legs**         | Drew 4 legs + an extra "udder" line that looks like a leg |
| **Pig with 3 legs**         | Off-by-one in a loop, or one leg occluded behind another |
| **Horse with 6 legs**       | Drew front pair + back pair + middle pair (no idea why this is common) |
| **Animal with 0 legs**      | Just a body blob, model ran out of plan or budget       |
| **All animals with 4 legs** | ✅ Model genuinely reasoned about anatomy               |

The **0-eye sheep with 2 legs** is the most iconic LLM SVG failure
mode. It happens when the model:
1. Builds a fluffy white body cloud
2. Adds a small face circle
3. Adds 2 simple legs
4. Considers itself done because "it looks like a sheep"

A model that has actual spatial reasoning will pause on the leg count
and explicitly draw 4. A model that just pattern-matches won't.

---

## Optional bonus checks

| Check                                                  | Why it matters                                              |
|--------------------------------------------------------|-------------------------------------------------------------|
| Animals face roughly the same direction OR look natural in their pose | Tests scene composition |
| Sun's rays animate (rotating or pulsing)               | Bonus animation                                              |
| Tree canopies sway slightly                            | Bonus animation                                              |
| Each animal has slight individual color variation      | Tests within-species variety                                |
| Animals have small "shadows" beneath them on grass     | Bonus realism                                               |
| The 4 animals are spaced at varying depths (foreground/background scaling) | Tests perspective |
| File size under 30 KB                                  | Conciseness                                                 |
| Total scene reads as "pastoral" at a glance            | Subjective — gestalt check                                  |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| **Animals are unrecognizable blobs** | Can't tell which is which without labels           | Model didn't differentiate by features, just by color        |
| **Sheep with 2 legs / 1 eye**     | Iconic failure                                        | Pattern-matched "sheep = fluffy + face" with no anatomy reasoning |
| **Cow with 5 legs**               | Extra "leg" is actually the udder                     | Mixed up identifying features                                |
| **Pig has straight tail**         | Spec said curly, model drew a line                    | Curly path is hard, model gave up                            |
| **Horse looks like a deer / dog** | Wrong proportions: short neck or short legs           | Model confused horse silhouette                              |
| **Animals floating in sky**       | Legs end above the horizon                            | No grounding logic, animals positioned by bounding box only  |
| **All animals same height**       | Pig as big as horse                                   | Used same scale variable for all                             |
| **Trees floating**                | Trunk doesn't touch grass                             | Same grounding bug as animals                                |
| **Single-oval clouds**            | Generic flat ellipse instead of fluffy stack          | Skipped the multi-shape requirement                          |
| **Sun without rays**              | Just a yellow disk                                    | Skipped the rays requirement                                 |
| **Sun without halo**              | Hard-edged disk                                       | Skipped the halo gradient                                    |
| **Animals don't bounce**          | Static scene                                          | Forgot the animation                                         |
| **All bounce in perfect sync**    | Phase offset missing                                  | Used the same `animation-delay: 0s` for all                  |
| **Used emoji**                    | "🐄" instead of constructed SVG                       | Took the easy way out — instant fail                         |
| **Massive file (>50 KB)**         | Repetitive verbose paths instead of reusable shapes   | Didn't use `<g>` groups or `<use>` references               |
| **No grass / no sky**             | White background with floating animals                | Skipped the canvas requirement                               |
| **Cow is just spots, no body**    | Black blob shapes only                                | Body shape forgotten                                         |
| **Horse mane is missing or wrong place** | Mane on body instead of neck                  | Misplaced anatomy                                            |

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Sky + grass + horizon            |    ✓     |    ✓     |
| 3.  Sun w/ halo + 6+ rays            |    ✓     |    ✗     |
| 4.  3+ multi-shape clouds            |    ✓     |    ✗     |
| 5.  Clouds drift                     |    ✓     |    ✓     |
| 6.  Trees w/ trunk + canopy          |    ✓     |    ✓     |
| 7.  Trees rooted on grass            |    ✓     |    ✓     |
| 8.  ★ Cow has 4 legs                 |    ✓     |    ✓     |
| 9.  Cow black-and-white patches      |    ✓     |    ✓     |
| 10. Cow eyes + pink feature          |    ✓     |    ✗     |
| 11. ★ Sheep has 4 legs               |    ✓     |    ✗     |
| 12. Sheep fluffy multi-shape body    |    ✓     |    ✓     |
| 13. Sheep dark face + 2 eyes         |    ✓     |    ✗     |
| 14. ★ Pig has 4 legs                 |    ✓     |    ✓     |
| 15. Pig snout + 2 nostrils           |    ✓     |    ✗     |
| 16. Pig curly tail                   |    ✓     |    ✗     |
| 17. ★ Horse has 4 legs               |    ✓     |    ✓     |
| 18. Horse mane on neck               |    ✓     |    ✗     |
| 19. Horse tail at rear               |    ✓     |    ✓     |
| 20. Animals bounce w/ phase offset   |    ✓     |    ✓     |
| **Total**                            | **20/20**| **11/20**|

Bonus:
- All animals recognizable w/o labels:    Yes / No
- File size:                              X KB / Y KB
- Pastoral gestalt (subjective):          Yes / No
```

The example above shows a typical mid-tier result: leg counts mostly
correct (the easier rule-following), but the model gave up on detail
features (snouts, nostrils, manes, eyes) where the spec was more
involved. This is the diagnostic pattern — models that "get the shape
but skip the details" cluster around 11–14/20.

---

## Why this is the boss test

The other six tasks have one thing in common: their requirements describe
**behavior** (clock ticks, ball bounces, maze solves). Behavior is
algorithmic — it can be reasoned about with logic.

This task is different. It requires **constructing recognizable real-world
objects from primitive shapes**. That's a fundamentally different
capability. A model can ace algorithmic tasks while completely failing
to construct a recognizable cow, because:

1. **It has to plan an entire shape decomposition** before writing any
   SVG — what circles + rectangles + paths combine into a recognizable
   sheep? Many models can't.
2. **It has to count anatomical parts** while building each animal —
   not in the abstract, but in the live SVG it's generating. Off-by-one
   errors here are highly visible.
3. **It has to maintain spatial coherence** across 4 different animals
   and a scene background, all in one file, with grounding constraints.
4. **It can't fall back on text or emoji** — those are explicitly banned,
   so the model can't escape into "🐑" as a shortcut.

These pressures combine into the one task in the suite where you can
visually tell, in 5 seconds, whether the model in front of you is
genuinely doing visual reasoning or just templating from training data.

---

## Why this complements the suite

| Capability                            | Clock | Orrery | Sandbox | Fireworks | Life | Maze | Pasture |
|---------------------------------------|:-----:|:------:|:-------:|:---------:|:----:|:----:|:-------:|
| Geometry / proportions                |  ✅   |   ✅   |   —     |    ✅     |  —   |  —   |   ✅    |
| Real-world factual recall             |  —    |   ✅   |   —     |    —      |  —   |  —   |   ✅    |
| Animation                             |  ✅   |   ✅   |   ✅    |    ✅     |  ✅  |  ✅  |   ✅    |
| Pointer interaction                   |  —    |   ✅   |   ✅    |    ✅     |  ✅  |  —   |    —    |
| Physics                               |  —    |   —    |   ✅    |    ✅     |  —   |  —   |    —    |
| Cellular automata                     |  —    |   —    |   —     |    —      |  ✅  |  —   |    —    |
| Graph algorithms                      |  —    |   —    |   —     |    —      |  —   |  ✅  |    —    |
| **SVG primitive composition**         |  ⚠️   |   ⚠️   |   —     |    —      |  —   |  —   |   ✅    |
| **Anatomical reasoning (counting parts)** | — | —     |   —     |    —      |  —   |  —   |   ✅    |
| **Visual recognizability constraint** |  —    |   —    |   —     |    —      |  —   |  —   |   ✅    |
| **Multi-object scene composition**    |  —    |   ✅   |   —     |    —      |  —   |  —   |   ✅    |
| **Grounding / spatial coherence**     |  —    |   —    |   —     |    —      |  —   |  —   |   ✅    |

The pasture test is the **only** task in the suite that requires the
model to generate something a human would judge "looks like X" — for
five different X's at once.

---

## Combined suite metric (7 tasks)

```
suite_score = (clock/13 + orrery/15 + sandbox/15 + fireworks/15
             + life/15 + maze/15 + pasture/20) / 7
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

Suggested weights, with pasture as a 2× boss multiplier since it's
roughly 2× the difficulty of any single task:

```
weighted = (clock/13
          + orrery/15
          + 1.5 * sandbox/15
          + 1.25 * fireworks/15
          + 1.5 * life/15
          + 1.5 * maze/15
          + 2.0 * pasture/20) / 9.75
```

---

## Variants for the truly masochistic

**Tier 2 (medium-hard)** — Add:
- A **flock behavior**: sheep cluster together, the cow stays apart, the horse paces.
- **Day / night cycle**: 30-second wall-clock cycle where sun moves across sky,
  sky color shifts, stars appear at night.
- **Wind**: cloud speed varies, trees sway, grass shows wave motion.
4 extra checks. Tests stateful behavioral animation.

**Tier 3 (face-meltingly hard)** — Add:
- **8 species** instead of 4 (add: chicken, duck, goat, dog).
- **Each animal performs a species-specific behavior** in addition to bouncing:
    * Cow occasionally lowers its head to graze
    * Sheep occasionally bleats (open mouth animation)
    * Pig occasionally rolls in a small mud puddle
    * Horse occasionally rears up
    * Chicken pecks at the ground
    * Duck waddles in a small back-and-forth
    * Goat headbutts the air
    * Dog wags its tail (already curly tail movement)
- **The behaviors trigger pseudo-randomly** with cooldowns.
- **A user can click any animal** to trigger its behavior on demand.

This is the tier where even Claude Opus / GPT-4 / Gemini Ultra-class
models start producing visibly broken output. Useful for spotting where
frontier models actually plateau.

---

## Notes for benchmarking workflow

- **Run only 1–2 rounds per config** for this task. It's expensive
  (10–30 KB of SVG output, takes 30–90 seconds to generate) and
  variance is mostly in the "did it remember to draw all 4 legs"
  binary, which doesn't average meaningfully.
- **Score visually** — auto-grading is impractical here. A trained
  vision model might count legs in screenshots, but you'll save time
  just looking.
- **Print the screenshot at thumbnail size** (200 × 150 px) and ask:
  "can I tell what each animal is at a glance?" If yes, the model
  has succeeded at the gestalt level even if individual checks failed.
- **Save the raw SVG** for archive — really good outputs become
  showcase examples; really bad outputs become memes ("the two-legged
  one-eyed sheep of summer 2026").
- **Track the leg-count column** as a separate headline metric across
  models. Plotting "average legs per animal" is one of the funniest
  and most diagnostic charts you can produce in LLM evaluation.

---

## A note on the sheep

I'd like to formally apologize for the legendary 2-legged 1-eyed sheep.
That sheep should not have happened. The sheep deserved better.

The sheep is now the patron saint of this rubric. May future sheep be
better limbed and better eyed.