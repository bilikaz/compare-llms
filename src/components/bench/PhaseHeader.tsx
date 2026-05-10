import type { LiveRun } from '../../bench/runner';
import type { BenchSessionStatus, MetricUnit } from '../../types';
import { Btn, Card, Metric, Sparkline } from '../../ui/primitives';
import { ACCENT_BENCH, fmtDuration } from './utils';

interface Props {
  // The currently-running batch. Caller derives this from session.batches[currentBatchIndex].
  // Null once the session has advanced past its last batch (completed) — the
  // header still renders so the user can hit "new session".
  phase: { c: number; batchIndex: number; total: number } | null;
  liveSlots: LiveRun[];
  // Sparkline points for the active phase (sum chars/sec across slots).
  sparklineData: number[];
  // Pre-computed: completed runs / total scheduled runs across the whole session.
  completedCount: number;
  totalRuns: number;
  running: boolean;
  // Authoritative session status from the runner. Used to decide between
  // the "stopped" / "done" label — counts alone can lie (a stop hit after
  // the last batch finished still leaves completedCount === totalRuns even
  // though the user explicitly aborted).
  sessionStatus: BenchSessionStatus;
  unit: MetricUnit;
  onStop: () => void;
  // Tear down the current session view and return to the landing screen
  // (schedule preview + past-sessions list). Doesn't start anything new on
  // its own — the user picks the next thing from there.
  onClose: () => void;
  // Optional resume handler. When the session is stopped mid-schedule (i.e.
  // `phase.batchIndex < phase.total`), the header surfaces a `▶ resume from
  // batch N` button alongside `▶ new session`. When the session is complete or
  // resume is unsupported, leave this undefined.
  onResume?: () => void;
}

const METRIC_BASE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-sm)',
  whiteSpace: 'nowrap' as const,
};

function MLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{children}</span>;
}
function MValue({ children }: { children: React.ReactNode }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text-3)', marginLeft: -4 }}>{children}</span>;
}
function MThink({ value }: { value: string }) {
  return (
    <span style={{ ...METRIC_BASE, color: 'var(--c-text-4)', marginLeft: -4 }}>
      ({value} 💡)
    </span>
  );
}
function MRate({ value, unit }: { value: string; unit: string }) {
  return <span style={{ ...METRIC_BASE, color: 'var(--c-text)' }}>{value} {unit}</span>;
}

// Top card of the active session view. Shows phase number, batch progress,
// elapsed time of the current batch, and a live ch/s sparkline. The progress
// bar at the bottom reflects whole-session progress (completed / total runs).
export function PhaseHeader({
  phase,
  liveSlots,
  sparklineData,
  completedCount,
  totalRuns,
  running,
  sessionStatus,
  unit,
  onStop,
  onClose,
  onResume,
}: Props) {
  // Trust the runner-set status over derived counts so a manual stop after
  // the last run finished still reads as "stopped" rather than "done".
  const stopped = !running && (sessionStatus === 'aborted' || sessionStatus === 'paused' || sessionStatus === 'interrupted');
  const done = !running && sessionStatus === 'completed';
  // Batch elapsed = max sample time across live slots (they all started at the
  // same instant — modulo HTTP/1.1 connection-pool queueing — so the leading
  // slot's last sample is the batch wall-clock).
  const batchElapsedMs = liveSlots.reduce(
    (max, r) => Math.max(max, r.charSamples.at(-1)?.t ?? 0),
    0,
  );
  const progressPct = totalRuns > 0 ? (completedCount / totalRuns) * 100 : 0;

  // ── Aggregated live metrics across all slots in the current batch ──────
  // Mirrors the SlotPane row format (chars: N (M 💡) X ch/s) but summed.
  // Throughput is the sum of per-slot output divided by the batch wall-clock,
  // so the ch/s number reflects what the user actually feels (parallel work
  // compressed into the same wall-clock window).
  let totalOutChars = 0;
  let totalThinkChars = 0;
  let totalRealOutTokens = 0;
  let totalRealThinkTokens = 0;
  let anyRealUsage = false;
  for (const r of liveSlots) {
    totalOutChars += r.output.length;
    totalThinkChars += r.thinking.length;
    if (r.usage.outputTokens != null) { totalRealOutTokens += r.usage.outputTokens; anyRealUsage = true; }
    if (r.usage.thinkingTokens != null) { totalRealThinkTokens += r.usage.thinkingTokens; anyRealUsage = true; }
  }
  const totalChars = totalOutChars + totalThinkChars;
  const sec = batchElapsedMs / 1000;
  const aggChs = sec > 0 ? totalChars / sec : 0;

  const charsStr = totalChars > 0 ? totalChars.toLocaleString() : '—';
  const chsStr = aggChs > 0 ? aggChs.toFixed(0) : '—';

  // Tokens: real if any slot reported usage; else estimate from chars/4.
  const realTokens = totalRealOutTokens + totalRealThinkTokens;
  const tokensTotal = anyRealUsage ? realTokens : Math.round(totalChars / 4);
  const tokensStr = tokensTotal > 0
    ? `${anyRealUsage ? '' : '~'}${tokensTotal.toLocaleString()}`
    : '—';
  const toksStr = sec > 0 && tokensTotal > 0
    ? `${anyRealUsage ? '' : '~'}${(tokensTotal / sec).toFixed(0)}`
    : '—';

  let thinkBracket: string | undefined;
  if (totalThinkChars > 0) {
    if (unit === 'chars') {
      thinkBracket = totalThinkChars.toLocaleString();
    } else {
      thinkBracket = totalRealThinkTokens > 0
        ? totalRealThinkTokens.toLocaleString()
        : `~${Math.round(totalThinkChars / 4).toLocaleString()}`;
    }
  }

  // How many slots are still actively streaming (not done/aborted/errored).
  // Shown as `(●N)` next to `c=N` so you can see at a glance "12 of 16
  // still in flight". Uses the same blue dot as the StatusPill streaming
  // state for visual consistency.
  const streamingCount = liveSlots.reduce(
    (n, r) => n + (r.status === 'streaming' ? 1 : 0),
    0,
  );

  return (
    <Card style={{ padding: 'var(--pad-card)', borderLeft: `3px solid ${ACCENT_BENCH}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {phase ? (
          <>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-md)',
                fontWeight: 600,
              }}
            >
              <span style={{ color: 'var(--c-text-3)' }}>phase </span>
              <span style={{ color: ACCENT_BENCH }}>c={phase.c}</span>
              {running && streamingCount > 0 && (
                <span style={{ color: 'var(--c-text-3)', fontWeight: 400, marginLeft: 6 }}>
                  (<span style={{ color: 'var(--c-streaming, #93c5fd)' }}>▶</span>{' '}
                  <span style={{ color: 'var(--c-text-2)' }}>{streamingCount}</span>)
                </span>
              )}
            </span>
            <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>·</span>
            <Metric
              label="run"
              value={`${phase.batchIndex + 1} / ${phase.total}`}
              accent="var(--c-text)"
            />
            <Metric label="elapsed" value={fmtDuration(batchElapsedMs)} accent="var(--c-text)" />
            <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>·</span>
            {unit === 'tokens' ? (
              <>
                <MLabel>tokens:</MLabel>
                <MValue>{tokensStr}</MValue>
                {thinkBracket && <MThink value={thinkBracket} />}
                <MRate value={toksStr} unit="tok/s" />
              </>
            ) : (
              <>
                <MLabel>chars:</MLabel>
                <MValue>{charsStr}</MValue>
                {thinkBracket && <MThink value={thinkBracket} />}
                <MRate value={chsStr} unit="ch/s" />
              </>
            )}
            {sparklineData.length > 0 && (
              <>
                <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>·</span>
                <Sparkline width={140} data={sparklineData} peak />
              </>
            )}
          </>
        ) : (
          // Session has no in-flight phase. Header label reflects the
          // runner-set status: completed / aborted / paused.
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-md)',
              fontWeight: 600,
            }}
          >
            <span style={{ color: 'var(--c-text-3)' }}>session </span>
            <span
              style={{
                color: sessionStatus === 'completed'
                  ? ACCENT_BENCH
                  : 'var(--c-warn, #d97706)',
              }}
            >
              {sessionStatus === 'completed' ? 'complete' : sessionStatus}
            </span>
            <span style={{ color: 'var(--c-text-3)', fontWeight: 400, marginLeft: 8 }}>
              · {completedCount} / {totalRuns} runs
            </span>
          </span>
        )}
        {stopped && (
          <span
            style={{
              color: 'var(--c-warn, #d97706)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            stopped
          </span>
        )}
        {done && (
          <span
            style={{
              color: ACCENT_BENCH,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            done
          </span>
        )}
        <div style={{ flex: 1 }} />
        {running ? (
          <Btn danger onClick={onStop}>
            ■ stop session
          </Btn>
        ) : (
          <>
            {onResume && stopped && phase && (
              <Btn variant="primary" onClick={onResume}>
                ▶ resume from run {phase.batchIndex + 1}
              </Btn>
            )}
            <Btn onClick={onClose}>← back</Btn>
          </>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          height: 4,
          background: 'var(--c-border)',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div style={{ width: `${progressPct}%`, background: ACCENT_BENCH }} />
      </div>
    </Card>
  );
}
