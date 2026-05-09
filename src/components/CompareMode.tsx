import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { MetricUnit, ModelConfig, Round, RoundResult, RubricVote, RubricVotes, StreamUsage } from '../types';
import { loadConfigs, saveConfigs } from '../storage';
import { getCompareRounds, putCompareRound, deleteCompareRound } from '../db';
import { streamModel } from '../providers';
import { findTest } from '../tests';
import { ModelCard } from '../ui/ModelCard';
import { TestSelector } from '../ui/TestSelector';
import { PreviewBar } from '../ui/PreviewBar';
import { MainBlock } from '../ui/MainBlock';
import { RubricPanel } from '../ui/RubricPanel';
import { RatingPanel } from '../ui/RatingPanel';
import { ReviewBanner } from '../ui/ReviewBanner';
import { Mono } from '../ui/primitives';
import type { OverflowLevel, ViewMode } from '../ui/PreviewArea';
import { ACCENT_A, ACCENT_B, computeSummary } from './compare/utils';
import { SessionSummary } from './compare/SessionSummary';
import { RoundHistoryList } from './compare/RoundHistoryList';
import { downloadRoundsJson } from './compare/exportRounds';

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  overflow: OverflowLevel;
  onOverflowChange: (v: OverflowLevel) => void;
  unit: MetricUnit;
  registerExport: (fn: () => void) => void;
  showConfig: boolean;
}

// Per-side live state during streaming. Distinct from the persisted RoundResult
// because we re-render constantly while characters arrive — folding into the
// stored Round only happens once both sides finish.
interface LiveSide {
  text: string;
  thinking: string;
  usage: StreamUsage;
  durationMs: number;
  error?: string;
  status: 'idle' | 'streaming' | 'done' | 'error' | 'aborted';
  elapsedMs: number;
}
const emptyLive = (): LiveSide => ({
  text: '', thinking: '', usage: {}, durationMs: 0, status: 'idle', elapsedMs: 0,
});

// Map LiveSide.status to the StatusPill's narrower union.
function pillStatus(s: LiveSide): 'idle' | 'streaming' | 'done' | 'error' | 'aborted' {
  if (s.status === 'streaming') return 'streaming';
  if (s.status === 'aborted') return 'aborted';
  if (s.error) return 'error';
  if (s.status === 'idle') return 'idle';
  return 'done';
}

interface DisplayMetrics {
  time: string;
  chars: string;        // total chars (output + thinking)
  tokens: string;       // total tokens (real or estimated; '~' prefix if estimated)
  toks: string;         // tokens per second
  chs: string;          // chars per second
  // Pre-formatted thinking count for the bracketed `(N 💡)` suffix.
  // `undefined` when the model didn't produce reasoning. The formatter picks
  // chars or tokens depending on `unit`, with a `~` prefix for estimates.
  thinkBracket?: string;
}

function metricsFor(s: LiveSide, unit: MetricUnit): DisplayMetrics {
  const sec = s.elapsedMs / 1000;
  const totalChars = s.text.length + s.thinking.length;
  const realTokens = (s.usage.outputTokens ?? 0) + (s.usage.thinkingTokens ?? 0);
  const tokensTotal = realTokens > 0 ? realTokens : Math.round(totalChars / 4);
  // The total is estimated whenever neither side reported real usage —
  // i.e. once chars÷4 has touched the math at all.
  const tokensEstimated = realTokens === 0;

  // Bracket text differs by unit: chars are always real (we count them),
  // tokens may need a `~` prefix when only the estimate is available.
  let thinkBracket: string | undefined;
  if (s.thinking.length > 0) {
    if (unit === 'chars') {
      thinkBracket = s.thinking.length.toLocaleString();
    } else {
      const realThink = s.usage.thinkingTokens;
      thinkBracket = realThink != null && realThink > 0
        ? realThink.toLocaleString()
        : `~${Math.round(s.thinking.length / 4).toLocaleString()}`;
    }
  }

  return {
    time: `${sec.toFixed(1)}s`,
    chars: totalChars.toLocaleString(),
    tokens: tokensTotal > 0
      ? `${tokensEstimated ? '~' : ''}${tokensTotal.toLocaleString()}`
      : '—',
    toks: sec > 0 && tokensTotal > 0 ? `${tokensEstimated ? '~' : ''}${(tokensTotal / sec).toFixed(0)}` : '—',
    chs: sec > 0 ? (totalChars / sec).toFixed(0) : '—',
    thinkBracket,
  };
}

export function CompareMode({
  view, onViewChange, overflow, onOverflowChange, unit, registerExport, showConfig,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────
  const initial = loadConfigs();
  const [configA, setConfigA] = useState<ModelConfig>(initial.configA);
  const [configB, setConfigB] = useState<ModelConfig>(initial.configB);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<string>('custom');
  const [liveA, setLiveA] = useState<LiveSide>(emptyLive);
  const [liveB, setLiveB] = useState<LiveSide>(emptyLive);
  // When set, the main blocks render a historical round instead of live state.
  // Prompt becomes read-only; only votes can be edited.
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef<number | null>(null);

  // Hydrate stored rounds on mount; persist configs on change.
  useEffect(() => {
    let alive = true;
    getCompareRounds().then((rs) => { if (alive) setRounds(rs); }).catch(console.error);
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    saveConfigs({ ...loadConfigs(), configA, configB });
  }, [configA, configB]);

  // Elapsed ticker — only runs while at least one side is streaming.
  useEffect(() => {
    const anyStreaming = liveA.status === 'streaming' || liveB.status === 'streaming';
    if (!anyStreaming) {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    if (tickRef.current) return;
    tickRef.current = window.setInterval(() => {
      setLiveA((s) => s.status === 'streaming' ? { ...s, elapsedMs: s.elapsedMs + 100 } : s);
      setLiveB((s) => s.status === 'streaming' ? { ...s, elapsedMs: s.elapsedMs + 100 } : s);
    }, 100);
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [liveA.status, liveB.status]);

  // ── Generation pipeline ────────────────────────────────────────────
  const runSide = useCallback(async (
    cfg: ModelConfig,
    p: string,
    signal: AbortSignal,
    setLive: React.Dispatch<React.SetStateAction<LiveSide>>,
  ): Promise<{ text: string; thinking: string; usage: StreamUsage; durationMs: number; error?: string }> => {
    const start = performance.now();
    setLive({ ...emptyLive(), status: 'streaming' });
    let usage: StreamUsage = {};
    let text = '';
    let thinking = '';
    let errMsg: string | undefined;
    try {
      for await (const evt of streamModel(cfg, p, signal)) {
        if (evt.type === 'text') {
          text += evt.delta;
          setLive((s) => ({ ...s, text }));
        } else if (evt.type === 'thinking') {
          thinking += evt.delta;
          setLive((s) => ({ ...s, thinking }));
        } else if (evt.type === 'usage') {
          usage = { ...usage, ...evt.usage };
          setLive((s) => ({ ...s, usage }));
        } else if (evt.type === 'error') {
          errMsg = evt.message;
        }
      }
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name !== 'AbortError') errMsg = err?.message ?? String(e);
    }
    const durationMs = performance.now() - start;
    const status = signal.aborted ? 'aborted' : errMsg ? 'error' : 'done';
    setLive((s) => ({ ...s, status, durationMs, elapsedMs: durationMs, error: errMsg }));
    return { text, thinking, usage, durationMs, error: errMsg };
  }, []);

  async function generate() {
    if (!prompt.trim()) return;
    if (reviewingId) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const p = prompt;
    const [a, b] = await Promise.all([
      runSide(configA, p, ctrl.signal, setLiveA),
      runSide(configB, p, ctrl.signal, setLiveB),
    ]);
    if (ctrl.signal.aborted) return;

    const round: Round = {
      id: crypto.randomUUID(),
      prompt: p,
      testId: selectedTestId !== 'custom' ? selectedTestId : undefined,
      startedAt: Date.now(),
      configA, configB,
      resultA: {
        side: 'A', text: a.text, thinking: a.thinking, usage: a.usage,
        durationMs: a.durationMs, error: a.error,
        charCount: a.text.length, thinkingCharCount: a.thinking.length,
      },
      resultB: {
        side: 'B', text: b.text, thinking: b.thinking, usage: b.usage,
        durationMs: b.durationMs, error: b.error,
        charCount: b.text.length, thinkingCharCount: b.thinking.length,
      },
    };
    setRounds((rs) => [...rs, round]);
    putCompareRound(round).catch(console.error);
  }

  // ── Round / vote management ────────────────────────────────────────
  function newRound() {
    setPrompt('');
    setSelectedTestId('custom');
    setLiveA(emptyLive());
    setLiveB(emptyLive());
    setReviewingId(null);
  }

  function pickTest(id: string) {
    setSelectedTestId(id);
    if (id === 'custom') return;
    const t = findTest(id);
    if (t) setPrompt(t.prompt);
  }

  // Load a historical round into the main blocks for review.
  function loadRound(id: string) {
    const r = rounds.find((x) => x.id === id);
    if (!r) return;
    setReviewingId(id);
    setSelectedTestId(r.testId ?? 'custom');
    setPrompt(r.prompt);
    setLiveA({
      text: r.resultA.text, thinking: r.resultA.thinking, usage: r.resultA.usage,
      durationMs: r.resultA.durationMs, error: r.resultA.error,
      status: r.resultA.error ? 'error' : 'done',
      elapsedMs: r.resultA.durationMs,
    });
    setLiveB({
      text: r.resultB.text, thinking: r.resultB.thinking, usage: r.resultB.usage,
      durationMs: r.resultB.durationMs, error: r.resultB.error,
      status: r.resultB.error ? 'error' : 'done',
      elapsedMs: r.resultB.durationMs,
    });
  }

  function backToLive() { newRound(); }

  function vote(roundId: string, side: 'A' | 'B', checkId: string, voteVal: RubricVote | undefined) {
    setRounds((rs) => rs.map((r) => {
      if (r.id !== roundId) return r;
      const apply = (rr: RoundResult): RoundResult => {
        const next: RubricVotes = { ...(rr.rubricVotes ?? {}) };
        if (voteVal === undefined) delete next[checkId];
        else next[checkId] = voteVal;
        return { ...rr, rubricVotes: next };
      };
      const updated: Round = {
        ...r,
        resultA: side === 'A' ? apply(r.resultA) : r.resultA,
        resultB: side === 'B' ? apply(r.resultB) : r.resultB,
      };
      putCompareRound(updated).catch(console.error);
      return updated;
    }));
  }

  // 1–10 rating used by custom prompts (no rubric to vote against). The same
  // mechanism that the early app used; we kept the `rating` field on
  // RoundResult through every refactor for exactly this case.
  function setRating(roundId: string, side: 'A' | 'B', rating: number | undefined) {
    setRounds((rs) => rs.map((r) => {
      if (r.id !== roundId) return r;
      const updated: Round = {
        ...r,
        resultA: side === 'A' ? { ...r.resultA, rating } : r.resultA,
        resultB: side === 'B' ? { ...r.resultB, rating } : r.resultB,
      };
      putCompareRound(updated).catch(console.error);
      return updated;
    }));
  }

  function deleteRound(roundId: string) {
    setRounds((rs) => rs.filter((r) => r.id !== roundId));
    deleteCompareRound(roundId).catch(console.error);
    if (reviewingId === roundId) backToLive();
  }

  // ── Derived state ──────────────────────────────────────────────────
  // Active round = the one currently surfaced under the main blocks. While
  // reviewing, that's the chosen historical round; otherwise it's the latest
  // one so the rubric stays visible after a generate completes.
  const activeRoundId = reviewingId ?? (rounds.length ? rounds[rounds.length - 1].id : null);
  const activeRound = useMemo(
    () => rounds.find((r) => r.id === activeRoundId) ?? null,
    [rounds, activeRoundId],
  );
  const activeRubric = useMemo(() => {
    const tid = activeRound?.testId ?? (selectedTestId !== 'custom' ? selectedTestId : undefined);
    if (!tid) return null;
    return findTest(tid)?.rubric ?? null;
  }, [activeRound, selectedTestId]);
  const summary = useMemo(() => computeSummary(rounds), [rounds]);

  // Header export hook.
  const exportJSON = useCallback(() => {
    downloadRoundsJson({ rounds, configA, configB, currentTestId: selectedTestId });
  }, [rounds, configA, configB, selectedTestId]);
  useEffect(() => { registerExport(exportJSON); }, [registerExport, exportJSON]);

  const isStreaming = liveA.status === 'streaming' || liveB.status === 'streaming';
  const bothDone = liveA.status !== 'idle' && liveB.status !== 'idle' && !isStreaming;
  const selState: 'idle' | 'streaming' | 'done' | 'review' =
    reviewingId ? 'review' : isStreaming ? 'streaming' : bothDone ? 'done' : 'idle';

  const mA = metricsFor(liveA, unit);
  const mB = metricsFor(liveB, unit);
  const testLabel = activeRound?.testId ?? selectedTestId;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {reviewingId && activeRound && (
        <ReviewBanner onClose={backToLive} closeLabel="back to live">
          Reviewing <Mono><b>round #{rounds.findIndex((r) => r.id === reviewingId) + 1}</b></Mono>
          {' · '}<Mono>{activeRound.testId ?? 'custom'}</Mono>
          {' · votes editable, prompt locked'}
        </ReviewBanner>
      )}

      {showConfig && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
          <ModelCard side="A" accent={ACCENT_A} config={configA} onChange={setConfigA} />
          <ModelCard side="B" accent={ACCENT_B} config={configB} onChange={setConfigB} />
        </div>
      )}

      <TestSelector
        selectedTestId={selectedTestId}
        onSelectTest={pickTest}
        prompt={prompt}
        onPromptChange={(p) => {
          if (reviewingId) return;
          setPrompt(p);
          // Editing the prompt unsticks the preset selection.
          const preset = findTest(selectedTestId);
          if (preset && p !== preset.prompt) setSelectedTestId('custom');
        }}
        state={selState}
        info={`⌘↵ to generate · ${rounds.length} round${rounds.length !== 1 ? 's' : ''} stored`}
        onGenerate={generate}
        onRegenerate={generate}
        onStop={() => abortRef.current?.abort()}
        onNewRound={newRound}
        onBackToLive={backToLive}
      />

      <PreviewBar
        view={view}
        onViewChange={onViewChange}
        overflow={overflow}
        onOverflowChange={onOverflowChange}
        label="preview · both sides"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <MainBlock
          side="A"
          accent={ACCENT_A}
          provider={configA.provider}
          model={configA.model}
          extra={configA.extra}
          status={pillStatus(liveA)}
          time={mA.time}
          chars={mA.chars} tokens={mA.tokens} toks={mA.toks} chs={mA.chs}
          thinkBracket={mA.thinkBracket}
          unit={unit}
          view={view} overflow={overflow}
          // Don't render the iframe HTML mid-stream — re-mounting it on every
          // chunk is expensive. Wait until the side finishes.
          html={liveA.status !== 'streaming' && liveA.text ? liveA.text : undefined}
          raw={liveA.text}
          thinking={liveA.thinking}
          thinkingDisabled={!liveA.thinking}
          testLabel={testLabel}
        />
        <MainBlock
          side="B"
          accent={ACCENT_B}
          provider={configB.provider}
          model={configB.model}
          extra={configB.extra}
          status={pillStatus(liveB)}
          time={mB.time}
          chars={mB.chars} tokens={mB.tokens} toks={mB.toks} chs={mB.chs}
          thinkBracket={mB.thinkBracket}
          unit={unit}
          view={view} overflow={overflow}
          html={liveB.status !== 'streaming' && liveB.text ? liveB.text : undefined}
          raw={liveB.text}
          thinking={liveB.thinking}
          thinkingDisabled={!liveB.thinking}
          testLabel={testLabel}
        />
      </div>

      {activeRound && activeRubric && activeRubric.length > 0 && (
        <RubricPanel
          checks={activeRubric}
          votesA={activeRound.resultA.rubricVotes}
          votesB={activeRound.resultB.rubricVotes}
          onVote={(side, checkId, v) => vote(activeRound.id, side, checkId, v)}
          accentA={ACCENT_A}
          accentB={ACCENT_B}
        />
      )}
      {activeRound && (!activeRubric || activeRubric.length === 0) && (
        <RatingPanel
          ratingA={activeRound.resultA.rating}
          ratingB={activeRound.resultB.rating}
          onRate={(side, r) => setRating(activeRound.id, side, r)}
          accentA={ACCENT_A}
          accentB={ACCENT_B}
        />
      )}

      {summary && <SessionSummary summary={summary} unit={unit} />}

      <RoundHistoryList
        rounds={rounds}
        reviewingId={reviewingId}
        unit={unit}
        onLoad={loadRound}
        onDelete={deleteRound}
      />
    </div>
  );
}
