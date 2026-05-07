# llm/compare

Side-by-side LLM benchmarking tool. Send the same prompt to two models, watch them stream in parallel, render their HTML/SVG output in sandboxed iframes, rate each response 1–10, and aggregate stats across rounds.

Inspired by the @leftcurvedev_ x.com side-by-side LLM comparison videos.

## What it does

- **Two panels, one prompt.** Configure model A and model B independently. Hit generate — both stream concurrently with a live timer.
- **Renders generated content.** Models often produce HTML pages or SVG; the output renders in a sandboxed `<iframe>` next to the raw source. Tabs: `preview` / `raw` / `thinking`.
- **Live throughput stats.** `tok/s` (real if the provider sends usage, otherwise estimated as chars÷4 during streaming), `ch/s`, total chars, input/output/thinking tokens. Stats update during the reasoning phase too, not just text generation.
- **Rounds.** Rate each side 1–10. Hit `new round` (or `regenerate`) to run another prompt; previous rounds collapse below with full stats and an expandable diff.
- **Overall summary.** Average rating, total chars, total tokens, total time, chars/s, tokens/s — plus an automatic winner based on average rating.
- **Sized previews.** Global toggle in the header: `1:1` (square), `HD` (16:9), or `fit` (fill panel). Both panels stay symmetric regardless of which tab is active.
- **Persistence.** Configs and round history saved to `localStorage`. Export the whole session as JSON.

## Supported providers

All called directly from the browser — no backend, no proxy.

| Provider | API format | Notes |
|---|---|---|
| OpenAI-compatible | `/v1/chat/completions` | Covers OpenAI, OpenRouter, Together, Groq, vLLM, llama.cpp, LM Studio, Ollama (with OpenAI compat), DeepSeek. Auto-detect via `/v1/models`. Reads thinking from `delta.reasoning_content` (DeepSeek) or `delta.reasoning`. |
| Anthropic native | `/v1/messages` | Uses the `anthropic-dangerous-direct-browser-access` header. Parses `thinking_delta` for reasoning. |
| Google Gemini | `streamGenerateContent` | API key passed as URL param. Distinguishes thought parts via `part.thought` and reads `thoughtsTokenCount`. |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Configuring a model

Each side has:

- **Provider** — `openai` / `anthropic` / `gemini`. Switching resets the base URL to that provider's default.
- **Base URL** — for OpenAI-compatible servers, either `https://host` or `https://host/v1` works (the path joiner handles both).
- **API Key** — password field with show/hide. Leave empty for local servers (vLLM, llama.cpp, Ollama) that don't require auth.
- **Model** — type the id manually, or hit `auto-detect` to call `/v1/models` and pick from a dropdown.
- **Extra** — optional free-text label rendered in brackets after the model name (e.g. `[FP8 DFLASH k=3]`). Useful when the two sides serve the same model id from different deployments / quantizations.

Configs are saved to `localStorage` automatically.

## Generating

1. Configure both sides.
2. Type a prompt — `Cmd/Ctrl+Enter` to generate.
3. Watch both panels stream side-by-side with live `tok/s`.
4. Once both are done, rate each 1–10.
5. Hit `new round` for a fresh prompt, or `regenerate` to retry the same one. Previous rounds show up below with full stats and expandable preview.
6. `stop` cancels in-flight requests on both sides.

## Header controls

- **`hide config`** — collapse both model config cards. Each card also has its own `▾` chevron for per-side collapse.
- **`1:1 / HD / fit`** — global preview size. Applies to both panels.
- **`export JSON`** — downloads the full session (configs + rounds + ratings + stats).

## Stats

For each panel during streaming:

- `tok/s` (bold) — real if the server sends usage, else `~estimate` from chars÷4. Updates live during text generation **and** thinking.
- `ch/s` — secondary fallback rate.
- `chars` — total of text + thinking content.
- `out / in / think` — token counts from the server's `usage` field once available.

Summary table aggregates across all rounds: avg rating, total chars / tokens / time, chars/s, tokens/s. Winner is whichever side has the higher average rating.

## Browser security & limitations

- **API keys live in `localStorage`.** Fine for personal/local use; not for shared machines or kiosks. Clear your browser storage to reset.
- **Sandboxed previews.** Generated HTML/SVG renders in `<iframe sandbox="allow-scripts">` — scripts can run but can't touch the host page or the parent app's storage.
- **Mixed content.** If you deploy this over HTTPS but point at HTTP-only LLM servers, browsers will block the requests. Use HTTPS endpoints for production or run the dev server over HTTP.
- **CORS.** OpenAI-compatible servers usually allow `*`. vLLM, llama.cpp, Ollama, and the major hosted providers (OpenAI, OpenRouter, Together, Groq) work directly. Anthropic requires the dangerous-direct-browser-access header (already wired in). Some self-hosted setups behind a reverse proxy may need explicit CORS configuration.

## Tech

Vite + React 19 + TypeScript + Tailwind v3. No backend, no router, no global state library — just `useState` and `localStorage`. ~67 kB gzipped.

```
src/
├── App.tsx                       # State, generate loop, header
├── providers/
│   ├── openai.ts                 # /v1/chat/completions + /v1/models
│   ├── anthropic.ts              # /v1/messages
│   ├── gemini.ts                 # streamGenerateContent
│   ├── sse.ts                    # Minimal SSE parser
│   └── index.ts                  # Unified streamModel() / listModels()
├── components/
│   ├── ModelConfigCard.tsx       # Per-side config UI
│   ├── StreamPanel.tsx           # Header / status / stats / tabs / content box
│   ├── Preview.tsx               # Sandboxed iframe with HTML/SVG/text detection
│   ├── Rating.tsx                # 1–10 buttons
│   ├── RoundHistory.tsx          # Collapsed past rounds
│   └── Summary.tsx               # Aggregate stats table
├── storage.ts                    # localStorage load/save
└── types.ts                      # Shared types
```

## Build

```bash
npm run build       # tsc + vite build → dist/
npm run preview     # serve dist/
```
