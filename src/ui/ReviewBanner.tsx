import type { ReactNode } from 'react';
import { Btn } from './primitives';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

export function ReviewBanner({ children, onClose, closeLabel = 'back to live' }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(96,165,250,0.08)',
        border: '1px solid rgba(96,165,250,0.4)',
        color: '#bfdbfe',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <Btn onClick={onClose}>← {closeLabel}</Btn>}
    </div>
  );
}
