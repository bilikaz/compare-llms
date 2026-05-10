import { useEffect, useState } from 'react';
import { TESTS, type Difficulty } from '../../tests';
import { buildCustomSchedule, type BuiltSchedule } from '../../bench/schedule';
import type { CustomSchedule } from '../../types';
import {
  getCustomSchedules,
  putCustomSchedule,
  deleteCustomSchedule,
} from '../../db';
import { Btn, Card, Pill, Seg } from '../../ui/primitives';
import { Modal, ModalInput, ModalStat } from '../../ui/Modal';
import { ACCENT_BENCH } from './utils';
import type { ScheduleMode } from './SchedulePreview';

interface Props {
  startDisabled: boolean;
  onStart: (s: BuiltSchedule) => void;
  mode: ScheduleMode;
  onModeChange: (m: ScheduleMode) => void;
}

const MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: 'standardized', label: 'Standardized 112-run' },
  { value: 'custom', label: 'Custom...' },
];

const TIER_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'easy' },
  { value: 'medium', label: 'medium' },
  { value: 'hard', label: 'hard' },
  { value: 'boss', label: 'boss' },
];

// Tiny uppercase mono section label used between blocks of the builder.
// `style` overrides let callers drop the default block-marginBottom when
// the label is sitting inline in a flex row (otherwise it pushes itself
// off the baseline).
function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--c-text-3)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Custom schedule builder: pick tests by tier, compose a current Run (one
// parallel launch's worth of Tests), commit it to the all-runs list,
// drag-reorder, save/load named presets, then start. The orchestrator
// (BenchMode) just receives the BuiltSchedule on start — same path as the
// standardized preview.
export function CustomBuilder({ startDisabled, onStart, mode, onModeChange }: Props) {
  const [tier, setTier] = useState<Difficulty>('easy');
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[][]>([]);
  const [presets, setPresets] = useState<CustomSchedule[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // ── Modal state ──────────────────────────────────────────────────────
  // savePresetName: empty string = closed; '' typed = empty input.
  // We use null to mean "modal not open" so the input can hold ''.
  const [savePresetName, setSavePresetName] = useState<string | null>(null);
  const [pendingDeletePresetId, setPendingDeletePresetId] = useState<string | null>(null);
  const pendingDeletePreset = pendingDeletePresetId
    ? presets.find((p) => p.id === pendingDeletePresetId) ?? null
    : null;

  // Load saved presets on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await getCustomSchedules();
        if (alive) setPresets(all.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) { console.error(e); }
    })();
    return () => { alive = false; };
  }, []);

  const tierTests = TESTS.filter((t) => t.difficulty === tier);
  const totalRuns = batches.reduce((n, b) => n + b.length, 0);

  function addToCurrent(testId: string) {
    setCurrentBatch((cb) => [...cb, testId]);
  }
  function removeFromCurrent(idx: number) {
    setCurrentBatch((cb) => cb.filter((_, i) => i !== idx));
  }
  function commitBatch() {
    if (currentBatch.length === 0) return;
    setBatches((bs) => [...bs, currentBatch]);
    setCurrentBatch([]);
  }
  function deleteBatch(idx: number) {
    setBatches((bs) => bs.filter((_, i) => i !== idx));
  }
  function duplicateBatch(idx: number) {
    setBatches((bs) => {
      const next = bs.slice();
      next.splice(idx + 1, 0, [...bs[idx]]);
      return next;
    });
  }
  function reorderBatch(from: number, to: number) {
    if (from === to) return;
    setBatches((bs) => {
      const next = bs.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function refreshPresets() {
    try {
      const all = await getCustomSchedules();
      setPresets(all.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) { console.error(e); }
  }
  function openSavePresetModal() {
    if (batches.length === 0) return;
    setSavePresetName('');
  }
  async function commitSavePreset() {
    const name = (savePresetName ?? '').trim();
    if (!name || batches.length === 0) return;
    const preset: CustomSchedule = {
      id: crypto.randomUUID(),
      name,
      batches: batches.map((b) => [...b]),
      createdAt: Date.now(),
    };
    try {
      await putCustomSchedule(preset);
      await refreshPresets();
    } catch (e) { console.error(e); }
    setSavePresetName(null);
  }
  function loadPreset(p: CustomSchedule) {
    setBatches(p.batches.map((b) => [...b]));
    setCurrentBatch([]);
  }
  function openDeletePresetModal(id: string) {
    setPendingDeletePresetId(id);
  }
  async function commitDeletePreset() {
    if (!pendingDeletePreset) return;
    try {
      await deleteCustomSchedule(pendingDeletePreset.id);
      await refreshPresets();
    } catch (e) { console.error(e); }
    setPendingDeletePresetId(null);
  }

  function handleStart() {
    // Auto-commit a non-empty current batch so the user doesn't lose it.
    const finalBatches = currentBatch.length > 0 ? [...batches, currentBatch] : batches;
    if (finalBatches.length === 0) return;
    onStart(buildCustomSchedule('Custom', finalBatches));
  }

  const startReady = batches.length > 0 || currentBatch.length > 0;

  return (
    <>
      <Card style={{ padding: 'var(--pad-card)' }}>
        {/* Header: title + mode toggle + save preset action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-base)',
              color: 'var(--c-text)',
              fontWeight: 600,
            }}
          >
            Schedule
          </div>
          <Seg<ScheduleMode>
            options={MODE_OPTIONS}
            value={mode}
            onChange={onModeChange}
            accent={ACCENT_BENCH}
          />
          <div style={{ flex: 1 }} />
          <Btn onClick={openSavePresetModal} disabled={batches.length === 0}>↑ save preset…</Btn>
        </div>

        {/* Add tests: tier filter + clickable test pills */}
        <Label>add tests</Label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Seg<Difficulty>
            options={TIER_OPTIONS}
            value={tier}
            onChange={setTier}
            accent={ACCENT_BENCH}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {tierTests.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addToCurrent(t.id)}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--c-border)',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-2)',
                background: 'var(--c-surface-2)',
                cursor: 'pointer',
              }}
            >
              + {t.id}
            </button>
          ))}
        </div>

        {/* Current Run composer */}
        <Label>current run · c={currentBatch.length} (open)</Label>
        <div
          style={{
            border: '1px dashed var(--c-accent-bench)',
            borderRadius: 6,
            padding: 10,
            background: 'rgba(96,165,250,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 14,
            minHeight: 32,
          }}
        >
          {currentBatch.length === 0 ? (
            <span
              style={{
                color: 'var(--c-text-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
              }}
            >
              click a test above to add it to this run
            </span>
          ) : (
            currentBatch.map((id, i) => (
              <span
                key={`${id}-${i}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border-2)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                {id}
                <span
                  onClick={() => removeFromCurrent(i)}
                  style={{ color: 'var(--c-text-3)', cursor: 'pointer' }}
                  role="button"
                  aria-label={`remove ${id} from current run`}
                >
                  ×
                </span>
              </span>
            ))
          )}
          <Btn onClick={commitBatch} disabled={currentBatch.length === 0}>+ add run</Btn>
        </div>

        {/* All Runs list with drag-reorder */}
        <Label>all runs · drag to reorder</Label>
        <div
          style={{
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 6,
            minHeight: 60,
          }}
        >
          {batches.length === 0 && (
            <div
              style={{
                padding: 14,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-3)',
                textAlign: 'center',
              }}
            >
              no runs yet — compose one above and hit "+ add run"
            </div>
          )}
          {batches.map((b, i) => {
            const c = b.length;
            const isDragOver = dragIndex !== null && dragIndex !== i;
            return (
              <div
                key={i}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorderBatch(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 32px 60px 1fr auto',
                  gap: 10,
                  padding: '8px 12px',
                  borderBottom: i < batches.length - 1 ? '1px solid var(--c-border)' : 'none',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-sm)',
                  background: isDragOver ? 'rgba(96,165,250,0.06)' : 'transparent',
                  cursor: 'grab',
                }}
              >
                <span style={{ color: 'var(--c-text-4)' }}>⋮⋮</span>
                <span style={{ color: 'var(--c-text-3)' }}>{String(i + 1).padStart(2, '0')}.</span>
                <Pill
                  color={ACCENT_BENCH}
                  bg="rgba(96,165,250,0.08)"
                  style={{ borderColor: 'rgba(96,165,250,0.3)' }}
                >
                  c={c}
                </Pill>
                <span style={{ color: 'var(--c-text-2)', wordBreak: 'break-word' }}>
                  [{b.join(', ')}]
                </span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <Btn onClick={() => duplicateBatch(i)}>duplicate</Btn>
                  <Btn onClick={() => deleteBatch(i)}>×</Btn>
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer: totals + start */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--c-text-3)',
            }}
          >
            total: <b style={{ color: 'var(--c-text)' }}>{batches.length} runs</b>
            {' · '}
            <b style={{ color: ACCENT_BENCH }}>
              {totalRuns + currentBatch.length} tests
            </b>
            {currentBatch.length > 0 && (
              <span style={{ color: 'var(--c-text-3)' }}>
                {' · '}+{currentBatch.length} pending in current run
              </span>
            )}
          </span>
          <div style={{ flex: 1 }} />
          <Btn onClick={commitBatch} disabled={currentBatch.length === 0}>+ add run</Btn>
          <Btn
            variant="primary"
            onClick={handleStart}
            disabled={startDisabled || !startReady}
          >
            ▶ start session
          </Btn>
        </div>
      </Card>

      {/* Saved presets row */}
      <Card style={{ padding: 'var(--pad-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Label style={{ marginBottom: 0 }}>saved presets</Label>
          {presets.length === 0 ? (
            <span
              style={{
                color: 'var(--c-text-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-sm)',
              }}
            >
              — none yet
            </span>
          ) : (
            presets.map((p) => {
              const tests = p.batches.reduce((n, b) => n + b.length, 0);
              return (
                <span
                  key={p.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <button
                    type="button"
                    onClick={() => loadPreset(p)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--c-text-2)',
                      background: 'var(--c-surface-2)',
                      border: '1px solid var(--c-border)',
                      cursor: 'pointer',
                    }}
                  >
                    {p.name} · {tests} tests
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeletePresetModal(p.id)}
                    title="delete preset"
                    style={{
                      padding: '0 4px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--c-text-3)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>
      </Card>

      {/* Save-preset prompt — replaces window.prompt */}
      <Modal
        open={savePresetName !== null}
        intent="info"
        eyebrow="save preset"
        title="Name this preset"
        primary="save preset"
        primaryDisabled={!savePresetName?.trim()}
        onClose={() => setSavePresetName(null)}
        onPrimary={commitSavePreset}
      >
        <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--c-text-2)', lineHeight: 1.5 }}>
          Saved presets show up under SAVED PRESETS — click one to reload its runs into this builder.
        </p>
        <ModalInput
          value={savePresetName ?? ''}
          onChange={setSavePresetName}
          onEnter={() => { if (savePresetName?.trim()) commitSavePreset(); }}
          placeholder="e.g. mobile-only · 24 tests"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ModalStat
            k="contents"
            v={`${batches.length} runs · ${batches.reduce((n, b) => n + b.length, 0)} tests`}
          />
        </div>
      </Modal>

      {/* Delete-preset confirm — replaces window.confirm */}
      {pendingDeletePreset && (
        <Modal
          open
          intent="warn"
          eyebrow="delete preset"
          title={`Delete preset "${pendingDeletePreset.name}"?`}
          primary="delete"
          onClose={() => setPendingDeletePresetId(null)}
          onPrimary={commitDeletePreset}
        >
          <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--c-text-2)', lineHeight: 1.5 }}>
            The preset is removed from saved presets — your current builder state is unaffected.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ModalStat
              k="contents"
              v={`${pendingDeletePreset.batches.length} runs · ${pendingDeletePreset.batches.reduce((n, b) => n + b.length, 0)} tests`}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
