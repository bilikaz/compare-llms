import type { ReactNode } from 'react';
import { Btn } from './primitives';

// Per-side bundle. The pieces render with intentional emphasis so the eye
// can scan a long list: score + unit label + rate are white (load-bearing
// labels), volume + time are dimmed (supporting numbers). The medal
// indicator after the score shows who won the round at a glance.
//
//   A 9/9 🥇   chars:   1.1k (267 💡)   22 ch/s   50.0s
//   ↑ A.       ↑ wht.   ↑ gry.          ↑ wht.    ↑ gry.
export interface SideBundle {
  score: ReactNode;        // "9/9"
  // Optional medal / status emoji rendered immediately after the score.
  // Caller-controlled so this component stays unaware of round semantics.
  status?: string;
  unitLabel: string;       // "chars:" / "tokens:"
  volume: ReactNode;       // "1.1k (267 💡)"  (output count + thinking suffix)
  rate: ReactNode;         // "22 ch/s" / "~28 tok/s"
  time: string;            // "50.0s" — stream duration
}

interface Props {
  n: number;
  test: ReactNode;
  a: SideBundle;
  b: SideBundle;
  // Wall-clock timestamp string (e.g. "01:41 PM").
  time: string;
  current?: boolean;
  accentA?: string;
  accentB?: string;
  onLoad?: () => void;
  onDelete?: () => void;
}

// One row in the round-history list. Layout, left to right:
//
//   ▸ #N · test  |  A: score · volume · time   |   B: score · volume · time
//                 |  HH:MM PM  |  ↻ load · ×
//
// All A's metrics sit together, all B's metrics sit together — easier to
// scan than the old interleaved A | B | A | B grid which made it hard to
// tell which number belonged to which side.
export function RoundRow({
  n, test, a, b, time, current,
  accentA = 'var(--c-accent-a)',
  accentB = 'var(--c-accent-b)',
  onLoad, onDelete,
}: Props) {
  return (
    <div
      style={{
        display: 'grid',
        // chevron · title · A-group · B-group · timestamp · load · ×
        gridTemplateColumns: 'auto 1fr auto auto auto auto auto',
        gap: 14,
        alignItems: 'center',
        padding: '9px 12px',
        borderBottom: '1px solid var(--c-border)',
        background: current ? 'rgba(96,165,250,0.05)' : 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <span style={{ color: 'var(--c-text-3)' }}>▸</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--c-text-3)' }}>#{n} · </span>
        <span style={{ color: 'var(--c-text)' }}>{test}</span>
      </span>
      <SideGroup label="A" color={accentA} bundle={a} />
      <SideGroup label="B" color={accentB} bundle={b} />
      <span style={{ color: 'var(--c-text-3)' }}>{time}</span>
      {onLoad && <Btn onClick={onLoad}>↻ load</Btn>}
      {onDelete && <Btn onClick={onDelete}>×</Btn>}
    </div>
  );
}

// Inline group of one side's metrics. The side letter (A / B) wears its
// accent color; the labels (score, unit name, rate) are white because
// they're the load-bearing identifiers; the volume + duration are dim
// because they're the supporting numbers.
function SideGroup({ label, color, bundle }: { label: string; color: string; bundle: SideBundle }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color, fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--c-text)' }}>{bundle.score}</span>
      {bundle.status && <span>{bundle.status}</span>}
      <span style={{ color: 'var(--c-text)' }}>{bundle.unitLabel}</span>
      <span style={{ color: 'var(--c-text-3)' }}>{bundle.volume}</span>
      <span style={{ color: 'var(--c-text)' }}>{bundle.rate}</span>
      <span style={{ color: 'var(--c-text-3)' }}>{bundle.time}</span>
    </span>
  );
}
