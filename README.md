# compare-llms

Two-mode LLM benchmarking tool. Run side-by-side `Compare` (1 vs 1) or a single-model `Benchmark` session with a standardized concurrency schedule. Pick from 16 curated tests across 4 difficulty tiers, watch streams render in sandboxed iframes, vote rubric checks per side, and export the whole session as JSON.

Inspired by the @leftcurvedev_ x.com side-by-side LLM comparison videos; grew out of that into a more structured benchmark harness.

## Modes

The top-level header has a `Compare / Benchmark` toggle. Each mode keeps its own state (active session, history) — switching doesn't lose work.

### Compare — 1 vs 1
- Configure two model endpoints (A in emerald, B in pink)
- Pick a preset test or write a custom prompt — `⌘/Ctrl+Enter` to generate
- Both sides stream concurrently with live throughput stats
- After streaming: vote ✓/✗ on each rubric check (preset tests) or 1–10 rating (custom prompts)
- Round history collapses below; click any past round to load it back into the main blocks for review
- Aggregate session summary with per-side averages and a 🥇 / 🥈 / 🤝 medal verdict

### Benchmark — single model
- Configure one model
- Pick a schedule — Standardized 112-run preset, or a custom batch list
- Click `▶ start session`. The runner walks each batch sequentially, filling its slots in parallel, sampling chars-per-second every 250 ms
- Live phase header (sparkline + progress bar), slot grid, per-c stats card, completed-runs list
- Click any completed run to open it in a review overlay (full-size preview + rubric votes) — the running batch keeps streaming in the background
- Everything persists to IndexedDB; reload-safe

#### Standardized 112-run schedule

Each test runs exactly **7 times** across the session, distributed at multiple concurrency levels:

| Tier   | Schedule              | Slots | Per-test |
|--------|-----------------------|------:|---------:|
| boss   | c=1 ×6, c=2 ×4        |    14 |    7     |
| hard   | c=3 ×2, c=4 ×2        |    14 |    7     |
| medium | c=6 ×2, c=8 ×2        |    28 |    7     |
| easy   | c=12 ×2, c=16 ×2      |    56 |    7     |

**Total: 112 runs per session.** Throughput is measured at each `c` level so you can see how the model's rate scales (or saturates) under load.

## Supported providers

All called directly from the browser — no backend, no proxy.

| Provider | API format | Notes |
|---|---|---|
| OpenAI-compatible | `/v1/chat/completions` | OpenAI, OpenRouter, Together, Groq, vLLM, llama.cpp, LM Studio, Ollama, DeepSeek. Auto-detect via `/v1/models`. Reads thinking from `delta.reasoning_content` (DeepSeek) or `delta.reasoning`. |
| Anthropic native | `/v1/messages` | Uses the `anthropic-dangerous-direct-browser-access` header. Parses `thinking_delta`. |
| Google Gemini | `streamGenerateContent` | API key passed as URL param. Distinguishes thought parts via `part.thought` and reads `thoughtsTokenCount`. |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Configuring a model

- **Provider** — `openai` / `anthropic` / `gemini`. Switching resets the base URL to that provider's default.
- **Base URL** — for OpenAI-compatible servers, either `https://host` or `https://host/v1` works.
- **API Key** — password field with show/hide. Leave empty for local servers (vLLM, llama.cpp, Ollama).
- **Model** — type the id manually, or hit `detect` to call `/v1/models`.
- **Extra label** — free-text rendered in brackets after the model name (e.g. `[FP8 MTP k=3]`). Useful for distinguishing the same model across deployments / quantizations.

Compare keeps two configs (`configA`, `configB`); Benchmark keeps a separate `configBench`. All persist in `localStorage`.

## Header controls

- **Compare / Benchmark** — mode toggle (left)
- **Units: chars / tokens** — global toggle for the volume / throughput metric. Tokens are real when the provider reports usage (Anthropic, OpenAI, Gemini). For others (most vLLM, some Qwen/DeepSeek) tokens are estimated as `chars ÷ 4` and prefixed with `~`. Hover the toggle for the explanation tooltip.
- **▾ hide config** — collapse the model card(s). State is shared between modes.
- **↓ export** — download mode-specific JSON (compare rounds or bench session).

## Preview viewer

- **View modes**: `1:1` (square), `HD` (16:9), `9:16` (portrait, capped to 50% column width so it doesn't tower)
- **Overflow ring**: `off` / `1×` / `4×` / `10×` — adds visible dashed-border padding around the iframe so animations escaping the viewport (boss-animals bouncing, fireworks bursts, off-canvas drag previews) become visible. The harness injects a small CSS reset (`html, body { overflow: visible }`) into the iframe to keep the model's content from being clipped.
- **Code-fence stripping**: if a model wraps its HTML in ```html fences despite the "no markdown fences" instruction in every prompt, the iframe still renders correctly. The `raw` tab shows the literal output unchanged.
- Sandboxed via `<iframe sandbox="allow-scripts">` — scripts run but can't touch the host page or its storage.

## Stats

Live metric row per side, in the unit you've selected:

```
✓ done [12.3s]   chars: 5,136 (1,250 💡)  186 ch/s
✓ done [12.3s]   tokens: 4,190 (~318 💡)  47 tok/s
```

- **`chars:` / `tokens:`** — total volume (output + thinking)
- **`(N 💡)`** — thinking-only count, dimmed and bracketed
- **`186 ch/s` / `47 tok/s`** — instantaneous throughput

The same shape repeats in round history rows, the session summary, and the bench review overlay so the eye lands consistently across views.

## Rating

Two paths depending on the prompt:

- **Preset test** — rubric panel below the previews. Each check has ✓ / ✗ buttons per side; click again to clear. Sort by `unrated first` to walk through what's left.
- **Custom prompt** — 1–10 rating panel per side. Same outcome contributes to the session summary at `rating × 10` percentage.

Once both sides of a round are fully rated, a 🥇 / 🥈 / 🤝 medal appears in the round-history row to summarize the verdict at a glance.

## Test prompts

The [tests/](tests/) directory contains 16 curated benchmark prompts. Each `.md` file has YAML frontmatter (`difficulty`, `checks` list with `label` + optional `verify` text) and a `## Prompt` block. The app's dropdown loads them automatically — pick a test, the prompt drops into the textarea, and the rubric panel appears after generation.

### Easy — small / weak / quantized models

Each easy test mirrors a harder one stripped to ~30% complexity (static where the original was animated, single-object where the original had many).

| Test | Checks |
|---|---|
| [tests/easy-clock.md](tests/easy-clock.md) | 9 — static analog clock at 10:10 |
| [tests/easy-lineup.md](tests/easy-lineup.md) | 10 — solar system planet line-up (factual recall + Saturn ring) |
| [tests/easy-ball.md](tests/easy-ball.md) | 9 — single bouncing ball, gravity + floor bounce |
| [tests/easy-burst.md](tests/easy-burst.md) | 9 — click → particle burst |
| [tests/easy-grid.md](tests/easy-grid.md) | 9 — clickable grid editor with glider preset |
| [tests/easy-walker.md](tests/easy-walker.md) | 9 — static maze with keyboard-controlled player |
| [tests/easy-tictactoe.md](tests/easy-tictactoe.md) | 9 — turn-based state, win detection, end-of-game lockout |
| [tests/easy-paint.md](tests/easy-paint.md) | 9 — freehand mouse drag (`mousedown` / `mousemove` / `mouseup`) |

### Medium — mid-tier models

| Test | Checks |
|---|---|
| [tests/medium-clock.md](tests/medium-clock.md) | 17 — live geometric analog clock, trig, real-time tick |
| [tests/medium-solar.md](tests/medium-solar.md) | 22 — animated solar system orrery, orbital math, hover labels, z-order |
| [tests/medium-game.md](tests/medium-game.md) | 18, deterministic — Conway's Game of Life, double-buffered updates |
| [tests/medium-maze.md](tests/medium-maze.md) | 17, deterministic — maze generator + shortest-path solver + player |

### Hard — frontier models

| Test | Checks |
|---|---|
| [tests/hard-balls.md](tests/hard-balls.md) | 19 — bouncing balls physics sandbox, collision response, drag-to-throw, FPS |
| [tests/hard-fireworks.md](tests/hard-fireworks.md) | 17 — particle lifecycle, two-stage rocket→burst state machine, perf at scale |

### Boss — visual SVG reasoning

Pure spatial reasoning over SVG primitives (`<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, `<path>`, `<line>`). No emoji, no images, no clip-art. This is where most models humiliate themselves.

| Test | Checks |
|---|---|
| [tests/boss-fish.md](tests/boss-fish.md) | 18 — SVG underwater scene, 2 fish + bubbles + seaweed (~¼ the output size of pasture) |
| [tests/boss-animals.md](tests/boss-animals.md) | 22, brutal — SVG pasture scene with 4 recognizable animals from primitives |

Every test includes a `Layout stays usable when the window is resized` check — flip to `9:16` view or use `4×` overflow to spot layouts that fall apart at narrower widths.

## Storage

- **`localStorage`** — model configs (`configA`, `configB`, `configBench`), UI preferences (mode, units, view, show-config). Small, sync.
- **IndexedDB** — round history, bench sessions, bench runs (with `charSamples` timeseries), saved custom schedules. Bigger, async.
- **Auto-migration** — first load reads the old `llm-compare-v1` localStorage blob and copies any rounds into IndexedDB before clearing them from localStorage. Configs survive the migration.
- **Export** — both modes' header buttons download a self-contained JSON file with configs, runs, metrics (per-side `outputChars`, `thinkingChars`, `outputTokens`, `thinkingTokens`, `avgChs`, `peakChs`, `tokensPerSec`, `charsPerSec`, `charSamples`), and rubric votes / ratings.

## Browser security & limitations

- **API keys live in `localStorage`.** Fine for personal/local use; not for shared machines or kiosks.
- **Sandboxed previews.** Scripts can run but can't reach the parent app or its storage.
- **Mixed content.** HTTPS deployments can't talk to HTTP-only LLM servers — browsers block it. Use HTTPS endpoints in production.
- **CORS.** OpenAI-compatible servers usually allow `*`. vLLM, llama.cpp, Ollama, and the major hosted providers work directly. Anthropic uses the dangerous-direct-browser-access header (already wired in).
- **In-browser concurrency.** At `c=16` (easy phase) we have 16 parallel HTTP requests to the same host. HTTP/2 servers (modern vLLM, OpenAI) handle this fine; HTTP/1.1 servers will queue at the network layer and the throughput readings will reflect that queue, not the model.

## Tech

Vite + React 19 + TypeScript + Tailwind v3 (just for the base reset — the design uses CSS custom properties in `index.css`). No backend, no router, no global state library — `useState` + `localStorage` + IndexedDB. ~97 kB gzipped.

```
src/
├── App.tsx                            # mode router, global UI prefs, header
├── providers/                         # OpenAI / Anthropic / Gemini streaming
│   ├── openai.ts, anthropic.ts, gemini.ts
│   ├── sse.ts                         # minimal SSE parser
│   └── index.ts                       # streamModel() / listModels() / defaultBaseUrl()
├── bench/
│   ├── schedule.ts                    # standardized + custom batch generator
│   └── runner.ts                      # batch loop, 250 ms char sampling, aggregateByC
├── tests.ts                           # YAML frontmatter parser for tests/*.md
├── db.ts                              # IndexedDB wrapper + migration
├── storage.ts                         # localStorage (configs + UI prefs)
├── types.ts                           # shared types (Round, BenchRun, MetricUnit, …)
├── ui/
│   ├── primitives.tsx                 # Card, Btn, Seg, Pill, Tabs, StatusPill, Sparkline
│   ├── Header.tsx                     # logo + mode toggle + units toggle + export
│   ├── PreviewArea.tsx                # iframe wrapper, view modes, overflow ring
│   ├── PreviewBar.tsx                 # view + overflow controls
│   ├── MainBlock.tsx                  # streaming panel (status + metrics + tabs)
│   ├── ModelCard.tsx                  # provider / base url / api key / model card
│   ├── TestSelector.tsx               # tier-grouped dropdown + prompt textarea
│   ├── RubricPanel.tsx                # ✓/✗ vote rubric (single + two-side)
│   ├── RatingPanel.tsx                # 1–10 rating fallback for custom prompts
│   ├── ReviewBanner.tsx               # blue banner shown while reviewing past round
│   ├── RoundRow.tsx                   # one row in compare round history
│   └── bench.tsx                      # SlotPane / CompletedRow / ScheduleRow
└── components/
    ├── CompareMode.tsx                # compare orchestrator
    ├── BenchMode.tsx                  # bench orchestrator
    ├── compare/
    │   ├── SessionSummary.tsx         # per-side aggregate metrics card
    │   ├── RoundHistoryList.tsx       # reverse-chrono round rows
    │   ├── utils.ts                   # computeSummary, fmtK
    │   └── exportRounds.ts            # download rounds JSON
    └── bench/
        ├── SchedulePreview.tsx        # idle: schedule preview + start button
        ├── PhaseHeader.tsx            # active phase metrics + sparkline + stop
        ├── SlotGrid.tsx               # live slot panes
        ├── PerCStatsCard.tsx          # throughput stats per c-level
        ├── CompletedList.tsx          # filter / sort + run rows
        ├── ReviewOverlay.tsx          # review pane + rubric for one run
        ├── exportSession.ts           # download session JSON
        └── utils.tsx                  # ColHead, fmtDuration, ACCENT_BENCH

docs/
└── ui.md                              # UX specification (every screen, state, interaction)
```

## Build

```bash
npm run build       # tsc + vite build → dist/
npm run preview     # serve dist/
```
