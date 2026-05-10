import type { Tier } from '../../bench/data';
import { Card, Pill } from '../../ui/primitives';
import { ACCENT_BENCH, ColHead } from './utils';

interface Props {
  // Pre-aggregated per-tier scalars from Bench.tierList(). No iteration of
  // individual Tests on render — the engine maintains these counts as Tests
  // land and as votes change.
  tiers: Tier[];
}

// tier · pass · fail · unrated · tests rated · score
const COLUMNS = '70px 70px 70px 70px 110px 90px';

// Per-tier rubric tally for the active session. Sits beside PerCStatsCard so
// the user can see scoring progress at a glance: how many runs have been
// rated, how many pass/fail checks, how many checks still need votes.
export function RatingSummary({ tiers }: Props) {
  const stats = tiers.filter((t) => t.doneTestCount > 0);
  if (stats.length === 0) return null;

  const totals = stats.reduce(
    (acc, t) => ({
      totalTests: acc.totalTests + t.doneTestCount,
      passChecks: acc.passChecks + t.passChecks,
      failChecks: acc.failChecks + t.failChecks,
      unratedChecks: acc.unratedChecks + t.unratedChecks,
      totalChecks: acc.totalChecks + t.totalChecks,
    }),
    { totalTests: 0, passChecks: 0, failChecks: 0, unratedChecks: 0, totalChecks: 0 },
  );
  const totalScored = totals.passChecks + totals.failChecks;
  const totalPct = totalScored > 0 ? Math.round((totals.passChecks / totalScored) * 100) : 0;

  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Ratings
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · per tier
        </span>
        <div style={{ flex: 1 }} />
        <Pill
          color={ACCENT_BENCH}
          bg="rgba(96,165,250,0.08)"
          style={{ borderColor: 'rgba(96,165,250,0.3)' }}
        >
          {totals.passChecks} / {totalScored || '—'} ✓ ({totalPct}%)
        </Pill>
        {totals.unratedChecks > 0 && (
          <Pill>
            {totals.unratedChecks} unrated
          </Pill>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          gap: 14,
          paddingBottom: 6,
          borderBottom: '1px solid var(--c-border-2)',
        }}
      >
        <ColHead>tier</ColHead>
        <ColHead>pass</ColHead>
        <ColHead>fail</ColHead>
        <ColHead>unrated</ColHead>
        <ColHead>tests rated</ColHead>
        <ColHead align="right">score</ColHead>
      </div>
      {stats.map((s, i) => {
        const scored = s.passChecks + s.failChecks;
        const pct = scored > 0 ? Math.round((s.passChecks / scored) * 100) : null;
        const allRated = s.fullyRatedTestCount === s.doneTestCount;
        return (
          <div
            key={s.tier}
            style={{
              display: 'grid',
              gridTemplateColumns: COLUMNS,
              gap: 14,
              padding: '8px 0',
              borderBottom: i < stats.length - 1 ? '1px solid var(--c-border)' : 'none',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            <span style={{ color: ACCENT_BENCH, fontWeight: 600 }}>{s.tier}</span>
            <span style={{ color: 'var(--c-pass, #34d399)' }}>{s.passChecks}</span>
            <span style={{ color: 'var(--c-fail, #b91c1c)' }}>{s.failChecks}</span>
            <span style={{ color: s.unratedChecks > 0 ? '#fcd34d' : 'var(--c-text-3)' }}>
              {s.unratedChecks}
            </span>
            <span>
              <span style={{ color: allRated ? 'var(--c-pass, #34d399)' : 'var(--c-text)' }}>
                {s.fullyRatedTestCount}
              </span>
              <span style={{ color: 'var(--c-text-3)' }}> / {s.doneTestCount}</span>
            </span>
            <span style={{ color: 'var(--c-text)', fontWeight: 600, textAlign: 'right' }}>
              {pct == null ? '—' : `${pct}%`}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
