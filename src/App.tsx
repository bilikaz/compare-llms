import { useEffect, useRef, useState, useCallback } from 'react';
import type { ModelConfig, Round, RoundResult, StreamUsage } from './types';
import { loadState, saveState } from './storage';
import { streamModel } from './providers';
import { ModelConfigCard } from './components/ModelConfigCard';
import { StreamPanel } from './components/StreamPanel';
import { RoundHistory } from './components/RoundHistory';
import { Summary } from './components/Summary';
import type { PreviewSize } from './components/Preview';

const ACCENT_A = '#34d399';
const ACCENT_B = '#f472b6';

type LiveResult = RoundResult;

const emptyResult = (): LiveResult => ({
  side: 'A',
  text: '',
  thinking: '',
  usage: {},
  durationMs: 0,
  charCount: 0,
  thinkingCharCount: 0,
});

type Status = 'idle' | 'streaming' | 'done' | 'error';

export default function App() {
  const initial = loadState();
  const [configA, setConfigA] = useState<ModelConfig>(initial.configA);
  const [configB, setConfigB] = useState<ModelConfig>(initial.configB);
  const [rounds, setRounds] = useState<Round[]>(initial.rounds);

  const [prompt, setPrompt] = useState<string>('');
  const [resultA, setResultA] = useState<LiveResult>(emptyResult);
  const [resultB, setResultB] = useState<LiveResult>(emptyResult);
  const [statusA, setStatusA] = useState<Status>('idle');
  const [statusB, setStatusB] = useState<Status>('idle');
  const [elapsedA, setElapsedA] = useState(0);
  const [elapsedB, setElapsedB] = useState(0);
  const [showConfig, setShowConfig] = useState(true);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('square');

  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef<number | null>(null);
  const statusARef = useRef(statusA);
  const statusBRef = useRef(statusB);
  useEffect(() => { statusARef.current = statusA; }, [statusA]);
  useEffect(() => { statusBRef.current = statusB; }, [statusB]);

  useEffect(() => {
    saveState({ configA, configB, rounds });
  }, [configA, configB, rounds]);

  useEffect(() => {
    if (statusA !== 'streaming' && statusB !== 'streaming') {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    if (tickRef.current) return;
    tickRef.current = window.setInterval(() => {
      if (statusARef.current === 'streaming') setElapsedA((e) => e + 100);
      if (statusBRef.current === 'streaming') setElapsedB((e) => e + 100);
    }, 100);
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [statusA, statusB]);

  const runSide = useCallback(async (
    side: 'A' | 'B',
    cfg: ModelConfig,
    p: string,
    signal: AbortSignal,
    setResult: React.Dispatch<React.SetStateAction<LiveResult>>,
    setStatus: (s: Status) => void,
    setElapsed: (n: number) => void,
  ) => {
    const start = performance.now();
    setStatus('streaming');
    setResult({ ...emptyResult(), side });
    setElapsed(0);
    let usage: StreamUsage = {};
    let text = '';
    let thinking = '';
    let errMsg: string | undefined;
    try {
      for await (const evt of streamModel(cfg, p, signal)) {
        if (evt.type === 'text') {
          text += evt.delta;
          setResult((r) => ({ ...r, text, charCount: text.length }));
        } else if (evt.type === 'thinking') {
          thinking += evt.delta;
          setResult((r) => ({ ...r, thinking, thinkingCharCount: thinking.length }));
        } else if (evt.type === 'usage') {
          usage = { ...usage, ...evt.usage };
          setResult((r) => ({ ...r, usage }));
        } else if (evt.type === 'error') {
          errMsg = evt.message;
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') errMsg = e?.message ?? String(e);
    }
    const durationMs = performance.now() - start;
    setElapsed(durationMs);
    setResult((r) => ({ ...r, durationMs, error: errMsg }));
    setStatus(errMsg ? 'error' : 'done');
    return { text, thinking, usage, durationMs, error: errMsg };
  }, []);

  async function generate() {
    if (!prompt.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const p = prompt;
    const [a, b] = await Promise.all([
      runSide('A', configA, p, ctrl.signal, setResultA, setStatusA, setElapsedA),
      runSide('B', configB, p, ctrl.signal, setResultB, setStatusB, setElapsedB),
    ]);

    if (ctrl.signal.aborted) return;

    const round: Round = {
      id: crypto.randomUUID(),
      prompt: p,
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
  }

  function newRound() {
    setPrompt('');
    setResultA(emptyResult());
    setResultB(emptyResult());
    setStatusA('idle');
    setStatusB('idle');
    setElapsedA(0);
    setElapsedB(0);
  }

  function rateLatest(side: 'A' | 'B', rating: number) {
    setRounds((rs) => {
      if (!rs.length) return rs;
      const last = rs[rs.length - 1];
      const updated: Round = {
        ...last,
        resultA: side === 'A' ? { ...last.resultA, rating: rating || undefined } : last.resultA,
        resultB: side === 'B' ? { ...last.resultB, rating: rating || undefined } : last.resultB,
      };
      return [...rs.slice(0, -1), updated];
    });
    if (side === 'A') setResultA((r) => ({ ...r, rating: rating || undefined }));
    else setResultB((r) => ({ ...r, rating: rating || undefined }));
  }

  function rateRound(roundId: string, side: 'A' | 'B', rating: number) {
    setRounds((rs) => rs.map((r) => {
      if (r.id !== roundId) return r;
      return {
        ...r,
        resultA: side === 'A' ? { ...r.resultA, rating: rating || undefined } : r.resultA,
        resultB: side === 'B' ? { ...r.resultB, rating: rating || undefined } : r.resultB,
      };
    }));
  }

  function deleteRound(roundId: string) {
    setRounds((rs) => rs.filter((r) => r.id !== roundId));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ configA, configB, rounds }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-compare-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isStreaming = statusA === 'streaming' || statusB === 'streaming';
  const bothDone = statusA !== 'idle' && statusB !== 'idle' && !isStreaming;
  const latestRound = rounds[rounds.length - 1];

  function retryA() {
    if (!prompt.trim()) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    runSide('A', configA, prompt, ctrl.signal, setResultA, setStatusA, setElapsedA);
  }
  function retryB() {
    if (!prompt.trim()) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    runSide('B', configB, prompt, ctrl.signal, setResultB, setStatusB, setElapsedB);
  }

  return (
    <div className="min-h-screen p-3 max-w-[1800px] mx-auto">
      <header className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-emerald-400">llm</span><span className="text-neutral-500">/</span><span className="text-pink-400">compare</span>
        </h1>
        <div className="flex gap-2 items-center">
          <button
            className="text-xs bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded px-2 py-1"
            onClick={() => setShowConfig(!showConfig)}
          >{showConfig ? 'hide' : 'show'} config</button>
          <div className="flex gap-1 text-xs">
            {(['square', 'hd', 'fit'] as PreviewSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setPreviewSize(s)}
                className={`px-2 py-1 rounded border ${previewSize === s ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                title={s === 'square' ? 'square preview' : s === 'hd' ? '16:9 preview' : 'fit panel'}
              >
                {s === 'square' ? '1:1' : s === 'hd' ? 'HD' : 'fit'}
              </button>
            ))}
          </div>
          <button
            className="text-xs bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded px-2 py-1"
            onClick={exportJSON}
          >export JSON</button>
        </div>
      </header>

      {showConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <ModelConfigCard config={configA} onChange={setConfigA} accent={ACCENT_A} />
          <ModelConfigCard config={configB} onChange={setConfigB} accent={ACCENT_B} />
        </div>
      )}

      <div className="border rounded-md p-3 mb-3 flex flex-col gap-2" style={{ borderColor: '#1f1f1f' }}>
        <textarea
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-2 text-sm font-mono min-h-[80px] resize-y"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt — e.g. 'Generate an SVG of a sunset over mountains' or 'Build an HTML page with a working calculator'"
          disabled={isStreaming}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate();
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500">
            ⌘/ctrl+enter to generate · {rounds.length} round{rounds.length !== 1 ? 's' : ''} stored
          </span>
          <div className="flex gap-2">
            {isStreaming ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="bg-red-700 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
              >stop</button>
            ) : bothDone ? (
              <>
                <button
                  onClick={newRound}
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-3 py-1 text-sm"
                >new round</button>
                <button
                  onClick={generate}
                  disabled={!prompt.trim() || !configA.model || !configB.model}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded px-3 py-1 text-sm"
                >regenerate</button>
              </>
            ) : (
              <button
                onClick={generate}
                disabled={!prompt.trim() || !configA.model || !configB.model}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded px-3 py-1 text-sm"
              >generate</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StreamPanel
          config={configA}
          result={resultA}
          status={statusA}
          elapsedMs={elapsedA}
          accent={ACCENT_A}
          size={previewSize}
          showRating={!!latestRound}
          onRate={(r) => rateLatest('A', r)}
          onRetry={statusA !== 'streaming' ? retryA : undefined}
        />
        <StreamPanel
          config={configB}
          result={resultB}
          status={statusB}
          elapsedMs={elapsedB}
          accent={ACCENT_B}
          size={previewSize}
          showRating={!!latestRound}
          onRate={(r) => rateLatest('B', r)}
          onRetry={statusB !== 'streaming' ? retryB : undefined}
        />
      </div>

      <Summary rounds={rounds} />
      <RoundHistory rounds={rounds} onRate={rateRound} onDelete={deleteRound} />
    </div>
  );
}
