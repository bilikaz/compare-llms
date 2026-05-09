import { useEffect, useRef, useState } from 'react';
import type { MetricUnit, Mode } from './types';
import { loadMode, saveMode, loadUnit, saveUnit } from './storage';
import { migrateLegacyRounds } from './db';
import { CompareMode } from './components/CompareMode';
import { BenchMode } from './components/BenchMode';
import { Header } from './ui/Header';
import { Btn } from './ui/primitives';
import type { OverflowLevel, ViewMode } from './ui/PreviewArea';

// Persist the configs-visible toggle so power users who rarely change their
// model setup can keep the cards collapsed across reloads.
const CONFIG_VISIBILITY_KEY = 'compare-llms.compare.showConfig';

// View-mode + overflow are global (apply to every preview iframe in the app).
// They live here so switching modes doesn't reset them. Each mode passes them
// down to the preview components it renders.

export default function App() {
  const [mode, setMode] = useState<Mode>(loadMode());
  const [view, setView] = useState<ViewMode>('1:1');
  const [overflow, setOverflow] = useState<OverflowLevel>(1);
  const [unit, setUnit] = useState<MetricUnit>(loadUnit());
  const [showConfig, setShowConfig] = useState<boolean>(
    () => localStorage.getItem(CONFIG_VISIBILITY_KEY) !== '0',
  );

  // Per-mode export handler — child modes register their handler via the
  // shared ref so the global header's export button can fire it.
  const exportRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => { saveMode(mode); }, [mode]);
  useEffect(() => { saveUnit(unit); }, [unit]);
  useEffect(() => {
    localStorage.setItem(CONFIG_VISIBILITY_KEY, showConfig ? '1' : '0');
  }, [showConfig]);
  useEffect(() => { migrateLegacyRounds().catch(console.error); }, []);

  // Toggle for the model config card(s). Same control in both modes — Compare
  // shows two cards, Bench shows one — but the button label and persistence
  // key are shared so the user's preference travels with them.
  const extraActions = (
    <Btn onClick={() => setShowConfig((v) => !v)}>
      {showConfig ? '▾ hide config' : '▸ show config'}
    </Btn>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        mode={mode}
        onModeChange={setMode}
        unit={unit}
        onUnitChange={setUnit}
        info={undefined}
        onExport={() => exportRef.current?.()}
        extraActions={extraActions}
      />
      <div style={{ flex: 1, padding: 'var(--pad-card)' }}>
        {mode === 'compare' ? (
          <CompareMode
            view={view}
            onViewChange={setView}
            overflow={overflow}
            onOverflowChange={setOverflow}
            unit={unit}
            registerExport={(fn) => { exportRef.current = fn; }}
            showConfig={showConfig}
          />
        ) : (
          <BenchMode
            view={view}
            onViewChange={setView}
            overflow={overflow}
            onOverflowChange={setOverflow}
            unit={unit}
            registerExport={(fn) => { exportRef.current = fn; }}
            showConfig={showConfig}
          />
        )}
      </div>
    </div>
  );
}
