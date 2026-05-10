import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { Btn } from './primitives';

export type ModalIntent = 'danger' | 'warn' | 'info';

const INTENT_COLOR: Record<ModalIntent, string> = {
  danger: 'var(--c-error, #f87171)',
  warn:   'var(--c-warn, #d97706)',
  info:   'var(--c-accent-bench)',
};
const INTENT_LABEL: Record<ModalIntent, string> = {
  danger: 'destructive',
  warn:   'warning',
  info:   'info',
};

interface Props {
  open: boolean;
  intent: ModalIntent;
  eyebrow?: string;          // small uppercase label next to the dot; defaults to intent label
  title: string;
  primary: string;
  secondary?: string;        // defaults to "cancel"
  secondaryHint?: string;    // small muted hint at the footer-left (e.g. "this cannot be undone")
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;  // defaults to onClose
  onClose: () => void;
  children?: ReactNode;
  width?: number;
}

// Modal shell — backdrop + dialog matching the design canvas
// (`ModalShell`). Renders nothing when `open` is false. Closes on
// Esc and on backdrop click. Single source of truth for confirmation
// dialogs across the app.
export function Modal({
  open,
  intent,
  eyebrow,
  title,
  primary,
  secondary = 'cancel',
  secondaryHint,
  primaryDisabled,
  onPrimary,
  onSecondary,
  onClose,
  children,
  width = 520,
}: Props) {
  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const color = INTENT_COLOR[intent];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width,
          maxWidth: '100%',
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderTop: `2px solid ${color}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans)',
          color: 'var(--c-text)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px 10px',
            borderBottom: '1px solid var(--c-border-2)',
          }}
        >
          <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              color,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {eyebrow ?? INTENT_LABEL[intent]}
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--c-text-3)',
            }}
          >
            esc
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-base)',
              color: 'var(--c-text-3)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '16px 18px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, lineHeight: 1.25 }}>
            {title}
          </div>
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px 14px',
            borderTop: '1px solid var(--c-border-2)',
            background: 'var(--c-bg)',
          }}
        >
          {secondaryHint && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--c-text-3)',
              }}
            >
              {secondaryHint}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Btn onClick={onSecondary ?? onClose}>{secondary}</Btn>
          <Btn
            variant={intent === 'danger' ? 'danger' : 'primary'}
            onClick={onPrimary}
            disabled={primaryDisabled}
          >
            {primary}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// Key/value row used inside a Modal body to surface context (e.g. "started ·
// today 11:08", "model · gpt-5.1-thinking"). Mirrors the canvas StatLine.
export function ModalStat({
  k,
  v,
  danger,
}: {
  k: string;
  v: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        padding: '8px 10px',
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <span style={{ color: 'var(--c-text-3)', minWidth: 110 }}>{k}</span>
      <span style={{ color: danger ? 'var(--c-error, #f87171)' : 'var(--c-text)', flex: 1 }}>
        {v}
      </span>
    </div>
  );
}

// Mono input styled to match the dialog's monospace key/value rows.
// Used inside Modal bodies for prompt-style flows (preset name etc.).
export function ModalInput({
  value,
  onChange,
  onEnter,
  placeholder,
  autoFocus = true,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
}) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.();
      }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
        background: 'var(--c-bg)',
        color: 'var(--c-text)',
        border: '1px solid var(--c-border-2)',
        padding: '8px 10px',
        outline: 'none',
        ...style,
      }}
    />
  );
}
