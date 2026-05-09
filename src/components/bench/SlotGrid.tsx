import type { MetricUnit } from '../../types';
import type { LiveRun } from '../../bench/runner';
import { SlotPane } from '../../ui/bench';
import type { OverflowLevel, ViewMode } from '../../ui/PreviewArea';
import type { Status } from '../../ui/primitives';
import { fmtDuration } from './utils';

interface Props {
  slots: LiveRun[];
  view: ViewMode;
  overflow: OverflowLevel;
  unit: MetricUnit;
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
export function SlotGrid({ slots, view, overflow, unit }: Props) {
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
      {slots.map((r) => (
        <SlotPane
          key={`${r.batchId}-${r.slotIndex}`}
          test={r.testId}
          status={mapStatus(r.status)}
          time={fmtDuration(r.charSamples.at(-1)?.t ?? 0)}
          chs={r.avgChs > 0 ? r.avgChs.toFixed(0) : '—'}
          toks={r.avgChs > 0 ? `~${(r.avgChs / 4).toFixed(0)}` : '—'}
          unit={unit}
          view={view}
          overflow={overflow}
          // Only render the iframe HTML once streaming completes — re-rendering
          // a sandboxed iframe on every chunk thrashes the browser.
          html={r.status !== 'streaming' && r.output ? r.output : undefined}
          thinkingDisabled={!r.thinking}
        />
      ))}
    </div>
  );
}
