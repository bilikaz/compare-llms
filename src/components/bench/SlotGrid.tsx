import type { MetricUnit } from '../../types';
import type { LiveRun } from '../../bench/runner';
import { SlotPane } from '../../ui/bench';
import type { OverflowLevel, ViewMode } from '../../ui/PreviewArea';
import type { Status } from '../../ui/primitives';
import { metricsForRun } from './utils';

interface Props {
  slots: LiveRun[];
  view: ViewMode;
  overflow: OverflowLevel;
  unit: MetricUnit;
  // Optional: caller can wire an explicit "restart this slot" action that
  // appears as a button on each slot pane. Hide by leaving undefined.
  onRestartSlot?: (slotIndex: number) => void;
}

// Map our wider BenchRunStatus union onto the StatusPill's narrower set.
// 'pending' shouldn't appear here since the slot only enters the live view
// once it starts streaming, but we fall back to 'idle' just in case.
function mapStatus(s: LiveRun['status']): Status {
  switch (s) {
    case 'streaming': return 'streaming';
    case 'done':      return 'done';
    case 'error':     return 'error';
    case 'aborted':   return 'aborted';
    default:          return 'idle';
  }
}

// Live slots laid out in a single row up to 4-wide; beyond that, the grid
// flows into multiple rows. The bench schedule reaches c=16 on easy phases —
// at that count we fall back to 4 columns so each pane stays readable.
export function SlotGrid({ slots, view, overflow, unit, onRestartSlot }: Props) {
  if (slots.length === 0) return null;
  const cols = Math.min(slots.length, 4);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--gap)',
      }}
    >
      {slots.map((r) => {
        const m = metricsForRun(r, unit);
        return (
          <SlotPane
            key={`${r.batchId}-${r.slotIndex}`}
            test={r.testId}
            status={mapStatus(r.status)}
            time={m.time}
            chars={m.chars}
            tokens={m.tokens}
            chs={m.chs}
            toks={m.toks}
            thinkBracket={m.thinkBracket}
            unit={unit}
            view={view}
            overflow={overflow}
            // Only feed the iframe HTML once streaming completes — re-rendering
            // a sandboxed iframe on every chunk thrashes the browser. Raw and
            // thinking text views are safe to update live (cheap <pre>).
            html={r.status !== 'streaming' && r.output ? r.output : undefined}
            raw={r.output}
            thinking={r.thinking}
            thinkingDisabled={!r.thinking}
            onRestart={
              onRestartSlot && r.status === 'streaming'
                ? () => onRestartSlot(r.slotIndex)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
