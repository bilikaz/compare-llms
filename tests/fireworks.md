# Fireworks Particle System — LLM Evaluation Rubric

Fourth benchmark task. Same interactive-physics spirit as the bouncing-balls
sandbox, but tests a different family of skills: particle lifecycle
management, two-stage state machines (rocket → explosion), alpha decay,
trail rendering, color variety, and performance under hundreds of
simultaneous lightweight objects.

Pair this with the clock + orrery + sandbox rubrics for a 4-task suite.

---

## The prompt

```
Generate a single self-contained HTML file (HTML + inline CSS + inline JavaScript,
no external assets, no CDN imports, no fetch calls) that renders an interactive
fireworks display.

HARD REQUIREMENTS — implement ALL of them:

CANVAS
- Full-viewport scene (100vw x 100vh), no scrollbars.
- Black or very dark blue background (night sky).
- A subtle horizon line a few pixels tall at the bottom edge.

ROCKETS (rising stage)
- On click anywhere in the upper 80% of the viewport, a rocket launches
  from a random x position at the bottom of the screen.
- The rocket is a small bright dot (3–5 px) with a fading trail behind it:
  at least 5 trail segments, each more transparent than the previous.
- The rocket rises with an initial upward velocity, decelerated continuously
  by gravity.
- The rocket's target altitude is the y-coordinate of the click. When the
  rocket reaches that y-coordinate (or runs out of upward velocity, whichever
  comes first), it triggers an explosion at that point.

EXPLOSIONS (burst stage)
- Each explosion spawns 60–120 particles in a single frame.
- Particles fly out radially from the explosion point in all directions
  with random speeds (creating a roughly circular burst pattern).
- Particles are affected by gravity (their paths curve downward over time).
- Each particle leaves a fading trail (3–5 segments) and has an alpha
  that decays over its lifetime.
- Particles disappear when their alpha reaches 0. Total particle lifetime
  ~1–2 seconds.
- Each explosion uses a random base color from a palette of at least
  6 distinct vivid colors. Particles within one explosion may vary slightly
  in hue/saturation but should clearly belong to the same firework.

AUTO-MODE
- If no user clicks happen for 3 seconds, a firework auto-launches to a
  random position. Auto-launches continue every 1–2 seconds until the
  user clicks again, at which point the 3-second idle timer resets.

UI
- In the top-left corner, show two live readouts:
    * "Particles: N" — current total particle count (rockets + explosion
       particles), updating in real time.
    * "FPS: NN" — current frames per second, refreshing ~once per second.

CONSTRAINTS
- Single file. No <link>, no <script src=...>, no network access.
- Smooth animation via requestAnimationFrame.
- Must remain above 30 FPS with 5+ simultaneous fireworks active.
- Total file size under 20 KB.
- No console errors on load.

OUTPUT FORMAT
- Return ONLY the contents of the .html file, starting with <!DOCTYPE html>.
- No markdown fences, no commentary before or after.
```

---

## Scoring rubric (15 mandatory checks)

| #  | Requirement                                              | How to verify                                                |
|----|----------------------------------------------------------|--------------------------------------------------------------|
| 1  | Renders without console errors                           | DevTools console clean on load                               |
| 2  | Black or dark blue background                            | Visual                                                       |
| 3  | Click launches a rocket from the bottom                  | Click anywhere → bright dot rises from bottom edge           |
| 4  | Rocket has a visible fading trail                        | Trail visibly tapers to transparent behind the rocket        |
| 5  | Rocket rises and decelerates (gravity acts during ascent)| Speed slows visibly toward apex                              |
| 6  | Rocket explodes at the click's y-coordinate              | Explosion happens at click height, not random or at top      |
| 7  | Explosion produces 60–120 particles                      | Visually a dense burst, not a sparse handful                 |
| 8  | Particles fly radially in all directions from burst point| Roughly circular spread, not a one-sided spray               |
| 9  | Particles curve downward (gravity affects them)          | Watch a few seconds — particles arc, not straight lines      |
| 10 | Particles have fading trails                             | Each particle leaves a short tail behind it                  |
| 11 | Particles fade and disappear (alpha decay)               | Burst dims and clears within ~1–2 s                          |
| 12 | Multiple fireworks can be active simultaneously          | Click 5 times rapidly — all should burst, not just one       |
| 13 | Color variety across fireworks                           | Different bursts in noticeably different colors              |
| 14 | Auto-mode triggers after 3 s idle                        | Stop clicking, wait — fireworks self-launch                  |
| 15 | Particle count AND FPS visible and updating              | Both numbers change as expected                              |

**Score = passes / 15.**

---

## Optional bonus checks

| Check                                                      | Why it matters                                              |
|------------------------------------------------------------|-------------------------------------------------------------|
| 30+ FPS with 500+ live particles on screen                 | Tests data-structure choice (array vs object pool)          |
| Particles fade with subtle hue shift over lifetime         | Bonus realism — real fireworks cool from yellow to red      |
| "Sparkle" effect: particle brightness twinkles             | Tests per-frame randomness                                  |
| Audio-free but explosion has a brief flash of light        | Tests two-frame visual emphasis                             |
| Different firework types (peony, willow, ring)             | Tests pattern variety                                       |
| File size under 20 KB                                      | Conciseness                                                 |
| Rocket trail color matches eventual explosion color        | Tests state-passing between stages                          |

---

## Common failure modes

| Mode                              | What you'll see                                       | Why it happens                                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------------------------------|
| Rocket flies off the top          | Rocket disappears, no explosion                       | No "reached target altitude" check; only triggers at apex   |
| Explosion at bottom of screen     | Burst happens at launch point, not click point        | Mixed up rocket origin with explosion target                |
| Sparse explosions                 | Only 5–10 particles per burst                         | Looped to wrong count, or overwrote spawn array             |
| All bursts the same color         | Spec said varied, model used one constant             | Color picked once at module load, not per-explosion         |
| Particles never fade              | Burst lingers indefinitely, screen fills up           | No alpha decay, no lifetime tracking                        |
| No trails on particles            | Just dots flying out, no "fireworks" feel             | Skipped the trail-segments part                             |
| Particles fly in straight lines   | No gravity influence after explosion                  | Forgot to apply gravity in particle update                  |
| FPS tanks after 2 fireworks       | Stutters into single digits                           | O(n²) loop, or DOM nodes per particle instead of canvas     |
| Memory leak                       | Tab slows over time even with no activity             | Dead particles never removed from array                     |
| Auto-mode never triggers          | Idle for 30 s, nothing happens                        | Missed the timer reset logic                                |
| Auto-mode never stops             | Clicking does nothing — keeps auto-firing             | Idle timer reset on click missing                           |
| Click outside upper 80% does nothing or breaks | No rocket fires from clicks near bottom      | Edge-case bound check                                       |
| Rocket trail "sticks" forever     | Old trail segments never clear                        | Drew trail without alpha decay or array trimming            |
| Particle count counter wrong      | Shows constant or wildly off number                   | Counted spawn events, not live particles                    |
| FPS reads as 0 or 1000+           | Wildly wrong number                                   | Δt math mistake (ms vs seconds, or 1/Δt with Δt=0)         |

---

## Suggested results table

```
| Check                                | Output A | Output B |
|--------------------------------------|:--------:|:--------:|
| 1.  No console errors                |    ✓     |    ✓     |
| 2.  Dark background                  |    ✓     |    ✓     |
| 3.  Click launches rocket            |    ✓     |    ✓     |
| 4.  Rocket has fading trail          |    ✓     |    ✗     |
| 5.  Rocket decelerates rising        |    ✓     |    ✓     |
| 6.  Explodes at click y              |    ✓     |    ✗     |
| 7.  60–120 particles per burst       |    ✓     |    ✓     |
| 8.  Radial spread                    |    ✓     |    ✓     |
| 9.  Particles curve under gravity    |    ✓     |    ✗     |
| 10. Particle trails                  |    ✓     |    ✗     |
| 11. Particles fade and clear         |    ✓     |    ✓     |
| 12. Multiple fireworks coexist       |    ✓     |    ✓     |
| 13. Color variety                    |    ✓     |    ✗     |
| 14. Auto-mode after 3 s idle         |    ✓     |    ✗     |
| 15. Particle count + FPS shown       |    ✓     |    ✓     |
| **Total**                            | **15/15**| **9/15** |

Bonus:
- 30+ FPS @ 500+ particles:       Yes / No
- Trail color matches burst:      Yes / No
- Hue shift over lifetime:        Yes / No
- File size:                      X KB / Y KB
```

---

## Why this rounds out the suite

| Capability                          | Clock | Orrery | Sandbox | Fireworks |
|-------------------------------------|:-----:|:------:|:-------:|:---------:|
| Radial / angular geometry           |  ✅   |   ✅   |   —     |    ✅     |
| Time / current-state binding        |  ✅   |   —    |   —     |    —      |
| Proportional sizing math            |  —    |   ✅   |   —     |    —      |
| Real-world factual recall           |  —    |   ✅   |   —     |    —      |
| Smooth animation                    |  ✅   |   ✅   |   ✅    |    ✅     |
| Pointer / hover / click interaction |  —    |   ✅   |   ✅    |    ✅     |
| Z-order layering                    |  —    |   ✅   |   —     |    —      |
| Numerical integration (physics)     |  —    |   —    |   ✅    |    ✅     |
| Rigid-body collision                |  —    |   —    |   ✅    |    —      |
| Mouse drag state machine            |  —    |   —    |   ✅    |    —      |
| Keyboard event handling             |  —    |   —    |   ✅    |    —      |
| **Particle lifecycle (spawn→fade→remove)** | — | —    |   —     |    ✅     |
| **Two-stage state machine (rocket→burst)** | — | —    |   —     |    ✅     |
| **Alpha / transparency animation**          | — | —    |   —     |    ✅     |
| **Trail / motion-history rendering**        | — | —    |   —     |    ✅     |
| **Hue/color variety with constraint**       | — | —    |   —     |    ✅     |
| **Idle-timer / auto-behavior logic**        | — | —    |   —     |    ✅     |
| **High-object-count perf (100s–1000s)**     | — | —    |   ⚠️    |    ✅     |

The sandbox stresses *quality* of physics (collisions must be correct).
Fireworks stresses *quantity* — the math per particle is trivial, but the
runtime has to handle hundreds of them at 60 FPS, plus alpha blending, plus
trails. Different bottleneck, different failure modes.

---

## Combined suite metric (4 tasks)

```
suite_score = (clock/13 + orrery/15 + sandbox/15 + fireworks/15) / 4
useful_tok_per_sec = avg_tok_per_sec * suite_score
```

If you want to weight by complexity (sandbox + fireworks are the heaviest):

```
weighted = (clock/13 + orrery/15 + 1.5*sandbox/15 + 1.25*fireworks/15) / 4.75
```

---

## Variants for harder difficulty

**Tier 2 (medium)** — Add:
- Multiple firework "types" the user can cycle through with number keys 1–4
  (peony = simple radial; willow = particles fall slowly with long trails;
  ring = particles spawn on a circle outline only; chrysanthemum = double-burst
  where each particle re-explodes after a delay).
- Mute/unmute toggle (bonus: WebAudio synth click for boom).
4 extra checks: 4 distinct types render correctly, key cycling works, etc.

**Tier 3 (hard)** — Add real audio: WebAudio synth generating a low
"whoosh" during ascent and a "crack" at burst, pitched per firework. Plus
wind: a horizontal acceleration that drifts particles, with a visible
indicator of wind strength/direction. Tests audio API + extra state.

---

## Notes for benchmarking workflow

- **Watch for 60+ seconds** before scoring — memory leaks and auto-mode
  bugs only manifest over time. A 5-second peek will pass a leaky
  implementation that would crash a tab in 3 minutes.
- **Stress-test deliberately**: click 20 times rapidly. A model that
  handles 1 firework can choke on 10 if particles aren't pooled.
- **Open DevTools Performance tab** for the perf bonus check — eyeballing
  FPS isn't reliable below 45 FPS or so. The in-page FPS counter is a
  decent proxy but trust the browser's instrumentation more.
- **Save as MP4 / GIF** for the archive. Stills tell you almost nothing
  about a particle system — motion is the whole point.
- **Run 5+ rounds** like the sandbox; particle systems are one of the
  more variance-prone tasks because tiny code differences can mean
  the difference between 30 and 200 FPS.
- Auto-grading note: this one is the hardest to grade automatically.
  Particle count + FPS counter give you two numeric handles, but most
  rubric items require visual judgment. Worth saving a 30 s recording
  per run for human review.