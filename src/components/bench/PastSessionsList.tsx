import { useState } from 'react';
import type { BenchSession } from '../../types';
import { Btn, Card, Pill } from '../../ui/primitives';
import { Modal, ModalStat } from '../../ui/Modal';
import { ACCENT_BENCH, ColHead, fmtDuration } from './utils';

interface Props {
  sessions: BenchSession[];
  onOpen: (session: BenchSession) => void;
  onResume: (session: BenchSession) => void;
  onDelete: (id: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtRelative(ts: number, now: number): string {
  const d = new Date(ts);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yest = new Date(today.getTime() - 86400_000);
  const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (dayStart.getTime() === today.getTime()) return `today · ${hh}:${mm}`;
  if (dayStart.getTime() === yest.getTime()) return `yesterday · ${hh}:${mm}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${hh}:${mm}`;
}

function totalRuns(s: BenchSession): number {
  return s.batches.reduce((n, b) => n + b.tests.length, 0);
}

// Completed runs = sum of batch sizes for batches advanced past. The runner
// advances currentBatchIndex after each batch settles, so this is exact for
// completed sessions and a slight under-count for sessions aborted mid-batch
// (the in-flight batch's persisted partial runs aren't counted).
function completedRuns(s: BenchSession): number {
  let n = 0;
  for (let i = 0; i < s.currentBatchIndex && i < s.batches.length; i++) n += s.batches[i].tests.length;
  return n;
}

function statusPill(status: BenchSession['status']): { label: string; color: string; bg?: string } {
  switch (status) {
    case 'running':     return { label: 'live',    color: '#fcd34d', bg: 'rgba(252,211,77,0.08)' };
    case 'aborted':     return { label: 'stopped', color: '#fcd34d', bg: 'rgba(252,211,77,0.08)' };
    case 'paused':      return { label: 'paused',  color: '#fcd34d', bg: 'rgba(252,211,77,0.08)' };
    case 'interrupted': return { label: 'paused',  color: '#fcd34d', bg: 'rgba(252,211,77,0.08)' };
    case 'completed':   return { label: 'done',    color: ACCENT_BENCH, bg: 'rgba(96,165,250,0.08)' };
    default:            return { label: status,    color: 'var(--c-text-2)' };
  }
}

// Wider trailing column so `▶ resume / open / ×` lines up cleanly across
// rows regardless of which actions are shown.
const COLS = '160px 1.2fr 100px 100px 90px 240px';

export function PastSessionsList({ sessions, onOpen, onResume, onDelete }: Props) {
  // Snapshot "now" once at mount so relative labels don't tick mid-render.
  const [now] = useState(() => Date.now());
  // Session id of the row whose × button is awaiting confirmation. Null
  // means no delete dialog is open. Prefer this over window.confirm so the
  // app stays inside its own visual language.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pending = pendingDeleteId
    ? sessions.find((x) => x.id === pendingDeleteId) ?? null
    : null;

  if (sessions.length === 0) return null;

  return (
    <Card style={{ padding: 'var(--pad-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>
          Past benchmark sessions
        </div>
        <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)' }}>
          · {sessions.length} session{sessions.length === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 6 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            gap: 10,
            padding: '10px 12px',
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <ColHead>started</ColHead>
          <ColHead>session · model</ColHead>
          <ColHead>tests</ColHead>
          <ColHead>duration</ColHead>
          <ColHead>status</ColHead>
          <ColHead align="right">{''}</ColHead>
        </div>
        {sessions.map((s, i) => {
          const total = totalRuns(s);
          const done = completedRuns(s);
          const dur = s.completedAt ? fmtDuration(s.completedAt - s.startedAt) : '—';
          const pill = statusPill(s.status);
          const resumable =
            s.currentBatchIndex < s.batches.length
            && (s.status === 'aborted' || s.status === 'paused' || s.status === 'idle' || s.status === 'interrupted');
          const idShort = `bench-…${s.id.slice(-4)}`;
          const modelLabel = `${s.modelConfig.model}${s.modelConfig.extra ? ` · ${s.modelConfig.extra}` : ''}`;
          return (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: 10,
                padding: '12px',
                borderBottom: i < sessions.length - 1 ? '1px solid var(--c-border)' : 'none',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
              }}
            >
              <span style={{ color: 'var(--c-text-3)' }}>{fmtRelative(s.startedAt, now)}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ color: 'var(--c-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idShort}</span>
                <span style={{ color: 'var(--c-text-3)', fontSize: 'var(--fs-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelLabel}</span>
              </span>
              <span>
                <b>{done}</b><span style={{ color: 'var(--c-text-3)' }}>/{total}</span>
              </span>
              <span style={{ color: 'var(--c-text-3)' }}>{dur}</span>
              <span><Pill color={pill.color} bg={pill.bg}>{pill.label}</Pill></span>
              <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {resumable && (
                  <Btn variant="primary" onClick={() => onResume(s)}>
                    ▶ resume
                  </Btn>
                )}
                <Btn onClick={() => onOpen(s)}>open</Btn>
                <Btn onClick={() => setPendingDeleteId(s.id)}>×</Btn>
              </span>
            </div>
          );
        })}
      </div>

      {pending && (
        <Modal
          open
          intent="danger"
          eyebrow="delete forever"
          title={`Delete bench-…${pending.id.slice(-4)}?`}
          primary="delete forever"
          secondaryHint="this cannot be undone"
          onClose={() => setPendingDeleteId(null)}
          onPrimary={() => {
            onDelete(pending.id);
            setPendingDeleteId(null);
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--c-text-2)', lineHeight: 1.5 }}>
            All {totalRuns(pending)} runs, raw streams, and rubric ratings for this session will be permanently removed.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <ModalStat k="started" v={fmtRelative(pending.startedAt, now)} />
            <ModalStat
              k="model"
              v={`${pending.modelConfig.model}${pending.modelConfig.extra ? ` · ${pending.modelConfig.extra}` : ''}`}
            />
            <ModalStat
              k="runs / done"
              v={`${totalRuns(pending)} · ${completedRuns(pending)} done`}
              danger={completedRuns(pending) > 0}
            />
          </div>
        </Modal>
      )}
    </Card>
  );
}
