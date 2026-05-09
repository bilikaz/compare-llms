import type { CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// ── Tokens (mirrors index.css :root, exported for JS consumers) ──────────
export const TOKENS = {
  accentA: 'var(--c-accent-a)',
  accentB: 'var(--c-accent-b)',
  accentBench: 'var(--c-accent-bench)',
} as const;

// ── Card ─────────────────────────────────────────────────────────────────
export function Card({
  children, style, ...rest
}: { children: ReactNode; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 8,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Mono span ────────────────────────────────────────────────────────────
export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontFamily: 'var(--font-mono)', ...style }}>{children}</span>;
}

// ── Pill ─────────────────────────────────────────────────────────────────
export function Pill({
  children,
  color = 'var(--c-text-2)',
  bg = 'var(--c-surface-2)',
  style,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 'var(--fs-xs)',
        fontFamily: 'var(--font-mono)',
        color,
        background: bg,
        border: '1px solid var(--c-border)',
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────────
export type BtnVariant = 'ghost' | 'solid' | 'primary' | 'danger';

const BTN_STYLES: Record<BtnVariant, CSSProperties> = {
  ghost: {
    background: 'transparent',
    color: 'var(--c-text-2)',
    border: '1px solid var(--c-border)',
  },
  solid: {
    background: 'var(--c-surface-2)',
    color: 'var(--c-text)',
    border: '1px solid var(--c-border-2)',
  },
  primary: {
    background: 'var(--c-text)',
    color: 'var(--c-bg)',
    border: '1px solid var(--c-text)',
  },
  danger: {
    background: '#7f1d1d',
    color: '#fecaca',
    border: '1px solid #991b1b',
  },
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  active?: boolean;
  danger?: boolean;
}

export function Btn({ children, variant = 'ghost', active, danger, style, ...rest }: BtnProps) {
  const v = danger ? BTN_STYLES.danger : BTN_STYLES[variant];
  const activeOverride: CSSProperties | undefined = active
    ? { background: 'var(--c-border-2)', color: 'var(--c-text)' }
    : undefined;
  return (
    <button
      style={{
        ...v,
        ...activeOverride,
        padding: '4px 10px',
        borderRadius: 5,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        height: 26,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Seg (segmented control) ──────────────────────────────────────────────
export type SegOption<T extends string> = T | { value: T; label: string };

export function Seg<T extends string>({
  options,
  value,
  onChange,
  accent,
  disabled,
}: {
  options: readonly SegOption<T>[];
  value: T;
  onChange?: (v: T) => void;
  accent?: string;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 6,
        padding: 2,
        gap: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((o) => {
        const v = (typeof o === 'string' ? o : o.value) as T;
        const lbl = typeof o === 'string' ? o : o.label;
        const isActive = v === value;
        return (
          <button
            key={v}
            disabled={disabled}
            onClick={() => onChange?.(v)}
            style={{
              padding: '3px 10px',
              background: isActive ? (accent ?? 'var(--c-border-2)') : 'transparent',
              color: isActive ? (accent ? '#0a0a0a' : 'var(--c-text)') : 'var(--c-text-2)',
              border: 0,
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export function Input({ mono = false, style, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        color: 'var(--c-text)',
        borderRadius: 5,
        padding: '5px 9px',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
        outline: 'none',
        height: 26,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

// ── Label ────────────────────────────────────────────────────────────────
export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 'var(--fs-xs)',
        color: 'var(--c-text-3)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── StatusPill ───────────────────────────────────────────────────────────
export type Status = 'idle' | 'streaming' | 'done' | 'error' | 'aborted';

const STATUS_STYLES: Record<Status, { color: string; label: string }> = {
  idle:      { color: 'var(--c-text-3)', label: 'idle' },
  streaming: { color: 'var(--c-streaming)', label: 'streaming' },
  done:      { color: 'var(--c-accent-a)', label: '✓ done' },
  error:     { color: 'var(--c-error)', label: 'error' },
  aborted:   { color: '#fb923c', label: 'aborted' },
};

export function StatusPill({ status = 'idle', time = '0.0s' }: { status?: Status; time?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        color: s.color,
      }}
    >
      {status === 'streaming' && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 6px ${s.color}`,
          }}
        />
      )}
      <span>{s.label}</span>
      <span style={{ color: 'var(--c-text-3)' }}>[{time}]</span>
    </div>
  );
}

// ── Metric (label + value pair, mono, used in toolbars) ──────────────────
export function Metric({
  label, value, accent,
}: { label: string; value: ReactNode; accent?: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--c-text-3)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--c-text-4)' }}>{label} </span>
      <span style={{ color: accent ?? 'var(--c-text-2)', fontWeight: accent ? 600 : 400 }}>
        {value}
      </span>
    </span>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────
export type TabItem<T extends string> = T | { value: T; label: string; disabled?: boolean };

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange?: (v: T) => void;
  items: readonly TabItem<T>[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: 'var(--c-bg)',
        padding: 2,
        borderRadius: 5,
        border: '1px solid var(--c-border)',
      }}
    >
      {items.map((it) => {
        const v = (typeof it === 'string' ? it : it.value) as T;
        const lbl = typeof it === 'string' ? it : it.label;
        const disabled = typeof it === 'object' && !!it.disabled;
        const isActive = v === value;
        return (
          <button
            key={v}
            disabled={disabled}
            onClick={() => onChange?.(v)}
            style={{
              padding: '3px 10px',
              background: isActive ? 'var(--c-surface-2)' : 'transparent',
              color: disabled ? 'var(--c-text-4)' : isActive ? 'var(--c-text)' : 'var(--c-text-2)',
              border: 0,
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

// ── Sparkline (tiny inline SVG) ──────────────────────────────────────────
// Renders a single polyline of `data`, normalized to the given dimensions.
// Pass `peak` to color it with the bench accent.
export function Sparkline({
  data,
  width = 90,
  height = 22,
  peak = false,
}: { data: number[]; width?: number; height?: number; peak?: boolean }) {
  if (!data.length) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }
  const max = Math.max(...data, 1);
  const denom = Math.max(1, data.length - 1);
  const path = data
    .map((p, i) => `${(i / denom) * width},${height - (p / max) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      <polyline
        points={path}
        fill="none"
        stroke={peak ? 'var(--c-accent-bench)' : 'var(--c-text-3)'}
        strokeWidth="1.2"
      />
    </svg>
  );
}
