import { Card } from './primitives';

interface Props {
  ratingA: number | undefined;
  ratingB: number | undefined;
  onRate: (side: 'A' | 'B', rating: number | undefined) => void;
  accentA?: string;
  accentB?: string;
}

// Custom prompts have no rubric to vote against, so we fall back to a plain
// 1–10 rating per side. Clicking the active number clears it (lets you
// undo a rating without leaving a forced value behind). Same shape as the
// rubric panel header so the two feel like cousins, not unrelated UIs.
export function RatingPanel({
  ratingA, ratingB, onRate,
  accentA = 'var(--c-accent-a)',
  accentB = 'var(--c-accent-b)',
}: Props) {
  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-base)',
            color: 'var(--c-text)',
            fontWeight: 600,
          }}
        >
          Rating
        </div>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          · custom prompt — no rubric, use 1–10
        </span>
      </div>
      <Row label="A" color={accentA} value={ratingA} onChange={(r) => onRate('A', r)} />
      <Row label="B" color={accentB} value={ratingB} onChange={(r) => onRate('B', r)} />
    </Card>
  );
}

function Row({
  label, color, value, onChange,
}: {
  label: string;
  color: string;
  value: number | undefined;
  onChange: (rating: number | undefined) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      <span
        style={{
          color,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          width: 18,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isOn = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(isOn ? undefined : n)}
              style={{
                width: 30,
                height: 26,
                borderRadius: 4,
                border: '1px solid var(--c-border-2)',
                background: isOn ? color : 'var(--c-bg)',
                color: isOn ? '#0a0a0a' : 'var(--c-text-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
              }}
            >
              {n}
            </button>
          );
        })}
        {value != null && (
          <button
            onClick={() => onChange(undefined)}
            title="Clear rating"
            style={{
              marginLeft: 4,
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid var(--c-border)',
              background: 'transparent',
              color: 'var(--c-text-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
