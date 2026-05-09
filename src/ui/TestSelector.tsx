import { useState, type CSSProperties } from 'react';
import { Btn, Card, Label } from './primitives';
import { TESTS, type BenchmarkTest, type Difficulty } from '../tests';

type SelectorState = 'idle' | 'streaming' | 'done' | 'review';

interface Props {
  selectedTestId: string;          // 'custom' or test.id
  onSelectTest: (id: string) => void;
  prompt: string;
  onPromptChange: (p: string) => void;
  state: SelectorState;
  // Per-state action buttons. Caller provides the click handlers.
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  onNewRound?: () => void;
  onBackToLive?: () => void;
  // Non-action info text shown to the left of the buttons.
  info?: string;
  // Hide buttons (Bench mode shows its own session controls instead).
  hideActions?: boolean;
  // Right-aligned button shown only when state === 'idle' and `hideActions`
  // is false. Used by Bench to put a "▶ start session" in the same row.
  primaryAction?: React.ReactNode;
}

const TIER_LABEL: Record<Difficulty, string> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  boss: 'boss',
};

const fieldStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'var(--c-bg)',
  border: '1px solid var(--c-border)',
  borderRadius: 5,
  padding: '5px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--c-text)',
  height: 26,
  boxSizing: 'border-box',
  cursor: 'pointer',
  position: 'relative',
};

function findTestById(id: string): BenchmarkTest | undefined {
  if (id === 'custom') return undefined;
  return TESTS.find((t) => t.id === id);
}

function summarize(t: BenchmarkTest | undefined, fallback: string): { tier: string; title: string; checks?: number } {
  if (!t) return { tier: 'custom', title: fallback || 'custom prompt' };
  return { tier: TIER_LABEL[t.difficulty], title: t.title, checks: t.rubric.length };
}

export function TestSelector({
  selectedTestId,
  onSelectTest,
  prompt,
  onPromptChange,
  state,
  onGenerate,
  onRegenerate,
  onStop,
  onNewRound,
  onBackToLive,
  info,
  hideActions = false,
  primaryAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const t = findTestById(selectedTestId);
  const summary = summarize(t, '');
  const isStreaming = state === 'streaming';
  const isReview = state === 'review';

  const grouped: Record<Difficulty, BenchmarkTest[]> = { easy: [], medium: [], hard: [], boss: [] };
  for (const x of TESTS) grouped[x.difficulty].push(x);
  const tierOrder: Difficulty[] = ['easy', 'medium', 'hard', 'boss'];

  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Label style={{ marginBottom: 0 }}>test</Label>
        <button
          type="button"
          onClick={() => !isStreaming && !isReview && setOpen((v) => !v)}
          disabled={isStreaming || isReview}
          style={{
            ...fieldStyle,
            opacity: isStreaming || isReview ? 0.6 : 1,
            cursor: isStreaming || isReview ? 'not-allowed' : 'pointer',
          }}
        >
          <span>
            <span style={{ color: 'var(--c-text-3)' }}>{summary.tier} · </span>
            {summary.title}
            {summary.checks != null && (
              <span style={{ color: 'var(--c-text-3)' }}> · {summary.checks} checks</span>
            )}
          </span>
          <span style={{ color: 'var(--c-text-3)' }}>▾</span>
          {open && (
            <div
              role="listbox"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: 6,
                padding: 4,
                zIndex: 30,
                maxHeight: 360,
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                cursor: 'default',
              }}
            >
              <button
                type="button"
                onClick={() => { onSelectTest('custom'); setOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '5px 8px',
                  background: selectedTestId === 'custom' ? 'var(--c-surface-2)' : 'transparent',
                  border: 0,
                  borderRadius: 4,
                  color: 'var(--c-text-2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                — custom prompt —
              </button>
              {tierOrder.map((tier) => grouped[tier].length > 0 && (
                <div key={tier}>
                  <div
                    style={{
                      padding: '8px 8px 4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--c-text-4)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    {tier}
                  </div>
                  {grouped[tier].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => { onSelectTest(opt.id); setOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '5px 8px',
                        background: selectedTestId === opt.id ? 'var(--c-surface-2)' : 'transparent',
                        border: 0,
                        borderRadius: 4,
                        color: 'var(--c-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--fs-sm)',
                      }}
                    >
                      {opt.title}
                      <span style={{ color: 'var(--c-text-4)', marginLeft: 6 }}>· {opt.rubric.length} checks</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        disabled={isStreaming || isReview}
        placeholder="Custom prompt — or pick a test above. ⌘↵ to generate."
        style={{
          width: '100%',
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 5,
          padding: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-sm)',
          color: isReview ? 'var(--c-text-2)' : 'var(--c-text)',
          minHeight: 64,
          lineHeight: 1.5,
          opacity: isStreaming || isReview ? 0.7 : 1,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate?.();
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
          {info ?? '⌘↵ to generate'}
        </span>
        <div style={{ flex: 1 }} />
        {!hideActions && state === 'idle' && (
          <>
            {onRegenerate && <Btn onClick={onRegenerate}>regenerate</Btn>}
            {onGenerate && <Btn variant="primary" onClick={onGenerate} disabled={!prompt.trim()}>generate</Btn>}
            {primaryAction}
          </>
        )}
        {!hideActions && state === 'streaming' && (
          <>
            {onStop && <Btn danger onClick={onStop}>■ stop</Btn>}
            <Btn variant="solid" disabled>streaming…</Btn>
          </>
        )}
        {!hideActions && state === 'done' && (
          <>
            {onNewRound && <Btn onClick={onNewRound}>new round</Btn>}
            {onRegenerate && <Btn onClick={onRegenerate}>regenerate</Btn>}
            {onGenerate && <Btn variant="primary" onClick={onGenerate} disabled={!prompt.trim()}>generate</Btn>}
          </>
        )}
        {!hideActions && state === 'review' && (
          <>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>
              prompt locked while reviewing
            </span>
            {onBackToLive && <Btn variant="solid" onClick={onBackToLive}>← back to live</Btn>}
          </>
        )}
      </div>
    </Card>
  );
}
