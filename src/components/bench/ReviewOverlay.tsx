import type { BenchRun, BenchSession, MetricUnit, RubricVote } from '../../types';
import type { BenchmarkTest } from '../../tests';
import { MainBlock } from '../../ui/MainBlock';
import { PreviewBar } from '../../ui/PreviewBar';
import { RubricPanel } from '../../ui/RubricPanel';
import type { OverflowLevel, ViewMode } from '../../ui/PreviewArea';
import type { Status } from '../../ui/primitives';
import { ACCENT_BENCH } from './utils';

interface Props {
  run: BenchRun;
  test: BenchmarkTest;
  session: BenchSession;
  view: ViewMode;
  overflow: OverflowLevel;
  unit: MetricUnit;
  onViewChange: (v: ViewMode) => void;
  onOverflowChange: (v: OverflowLevel) => void;
  onVote: (checkId: string, v: RubricVote | undefined) => void;
}

function mapStatus(s: BenchRun['status']): Status {
  switch (s) {
    case 'streaming': return 'streaming';
    case 'done':      return 'done';
    case 'error':     return 'error';
    case 'aborted':   return 'aborted';
    default:          return 'idle';
  }
}

// Bracketed thinking count formatted for the metrics row. Returns
// undefined when the run produced no reasoning. `unit` decides whether
// chars or tokens go in the bracket.
function thinkBracketFor(run: BenchRun, unit: MetricUnit): string | undefined {
  if (run.thinking.length === 0) return undefined;
  if (unit === 'chars') return run.thinking.length.toLocaleString();
  const real = run.usage.thinkingTokens;
  if (real != null && real > 0) return real.toLocaleString();
  return `~${Math.round(run.thinking.length / 4).toLocaleString()}`;
}

// Replaces the live slot grid while a completed run is being reviewed. The
// background batch keeps streaming and updates the completed list — this
// pane just borrows the main viewport for one run + its rubric.
export function ReviewOverlay({
  run, test, session, view, overflow, unit, onViewChange, onOverflowChange, onVote,
}: Props) {
  const cfg = session.modelConfig;
  const totalChars = run.output.length + run.thinking.length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <PreviewBar
          view={view}
          onViewChange={onViewChange}
          overflow={overflow}
          onOverflowChange={onOverflowChange}
          label={`preview · ${run.testId}`}
        />
        <MainBlock
          accent={ACCENT_BENCH}
          provider={cfg.provider}
          model={cfg.model}
          extra={cfg.extra}
          status={mapStatus(run.status)}
          time={`${(run.durationMs / 1000).toFixed(1)}s`}
          chars={totalChars.toLocaleString()}
          tokens={(() => {
            const real = (run.usage.outputTokens ?? 0) + (run.usage.thinkingTokens ?? 0);
            const total = real > 0 ? real : Math.round(totalChars / 4);
            return total > 0 ? `${real === 0 ? '~' : ''}${total.toLocaleString()}` : '—';
          })()}
          // tok/s estimate uses chars/4 against avgChs since runs persist
          // chars/sec rather than tokens/sec.
          toks={run.avgChs > 0 ? `~${(run.avgChs / 4).toFixed(0)}` : '—'}
          chs={run.avgChs > 0 ? run.avgChs.toFixed(0) : '—'}
          thinkBracket={thinkBracketFor(run, unit)}
          unit={unit}
          view={view}
          overflow={overflow}
          html={run.output}
          raw={run.output}
          thinking={run.thinking}
          thinkingDisabled={!run.thinking}
          testLabel={run.testId}
        />
      </div>
      {test.rubric.length > 0 && (
        <RubricPanel
          checks={test.rubric}
          votesSingle={run.rubricVotes}
          onVoteSingle={onVote}
          accent={ACCENT_BENCH}
        />
      )}
    </div>
  );
}
