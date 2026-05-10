import type { ModelConfig, MetricUnit } from '../../types';
import type { BenchmarkTest } from '../../tests';
import type { Test } from '../../bench/data/Test';
import { MainBlock } from '../../ui/MainBlock';
import { PreviewBar } from '../../ui/PreviewBar';
import { RubricPanel } from '../../ui/RubricPanel';
import type { OverflowLevel, ViewMode } from '../../ui/PreviewArea';
import type { Status } from '../../ui/primitives';
import { ACCENT_BENCH, metricsForRun } from './utils';

interface Props {
  test: Test;
  def: BenchmarkTest;
  modelConfig: ModelConfig;
  view: ViewMode;
  overflow: OverflowLevel;
  unit: MetricUnit;
  onViewChange: (v: ViewMode) => void;
  onOverflowChange: (v: OverflowLevel) => void;
}

function mapStatus(s: Test['status']): Status {
  switch (s) {
    case 'streaming': return 'streaming';
    case 'done':      return 'done';
    case 'error':     return 'error';
    case 'aborted':   return 'aborted';
    default:          return 'idle';
  }
}

// Replaces the live slot grid while a completed test is being reviewed. The
// background batch keeps streaming and updates the completed list — this
// pane just borrows the main viewport for one Test + its rubric.
//
// `test` is the live class instance — its rubricVotes/ratedAt mutations land
// on the same reference, so re-renders see fresh state without snapshots.
export function ReviewOverlay({
  test, def, modelConfig, view, overflow, unit, onViewChange, onOverflowChange,
}: Props) {
  // metricsForRun reads only frozen post-finalize fields (output, durationMs,
  // usage). A one-shot snapshot here is fine — votes don't flow through it.
  const m = metricsForRun(test.toPersisted(), unit);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <PreviewBar
          view={view}
          onViewChange={onViewChange}
          overflow={overflow}
          onOverflowChange={onOverflowChange}
          label={`preview · ${test.testId}`}
        />
        <MainBlock
          accent={ACCENT_BENCH}
          provider={modelConfig.provider}
          model={modelConfig.model}
          extra={modelConfig.extra}
          status={mapStatus(test.status)}
          time={m.time}
          chars={m.chars}
          tokens={m.tokens}
          chs={m.chs}
          toks={m.toks}
          thinkBracket={m.thinkBracket}
          unit={unit}
          view={view}
          overflow={overflow}
          html={test.output}
          raw={test.output}
          thinking={test.thinking}
          thinkingDisabled={!test.thinking}
          testLabel={test.testId}
        />
      </div>
      {def.rubric.length > 0 && (
        <RubricPanel
          checks={def.rubric}
          votesSingle={test.rubricVotes}
          onVoteSingle={(checkId, v) => test.vote(checkId, v).catch(console.error)}
          onVoteAllSingle={(v) => test.voteAll(v).catch(console.error)}
          accent={ACCENT_BENCH}
        />
      )}
    </div>
  );
}
