import { useState } from 'react';
import type { ModelConfig, ProviderKind } from '../types';
import { listModels, defaultBaseUrl } from '../providers';
import { Btn, Card, Input, Label, Seg } from './primitives';

interface Props {
  config: ModelConfig;
  onChange: (cfg: ModelConfig) => void;
  // Letter shown in the title row. "A" / "B" for Compare; omit for Bench (single).
  side?: 'A' | 'B';
  accent: string;
  // Layout: 'grid' = 2-col card (Compare); 'row' = horizontal strip (Bench).
  layout?: 'grid' | 'row';
}

const PROVIDERS: ProviderKind[] = ['openai', 'anthropic', 'gemini'];

export function ModelCard({ config, onChange, side, accent, layout = 'grid' }: Props) {
  const [models, setModels] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  function patch(p: Partial<ModelConfig>) {
    onChange({ ...config, ...p });
  }

  async function detect() {
    setLoading(true);
    setError(null);
    try {
      const list = await listModels(config);
      setModels(list);
      if (list.length && !config.model) patch({ model: list[0] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function setProvider(p: ProviderKind) {
    onChange({ ...config, provider: p, baseUrl: defaultBaseUrl(p) });
    setModels(null);
  }

  return (
    <Card style={{ padding: 'var(--pad-card)', borderTopColor: accent, borderTopWidth: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span
          style={{
            color: 'var(--c-text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          model
        </span>
        {side && (
          <span
            style={{
              color: accent,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-md)',
              fontWeight: 600,
            }}
          >
            {side}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          // 'row' layout puts every field on a single horizontal strip (Bench).
          // We give each field a minimum of 180px and let auto-fit wrap them
          // when the viewport is too narrow — without this, 5+ columns crammed
          // into one row would push the trailing fields (extra label) off the
          // right edge on common laptop widths.
          gridTemplateColumns: layout === 'row'
            ? 'repeat(auto-fit, minmax(180px, 1fr))'
            : '1fr 1fr',
          gap: 10,
        }}
      >
        {/* min-width: 0 lets grid children shrink below their inputs' default
            min-content widths. Without it the grid overflows horizontally. */}
        <div style={{ minWidth: 0 }}>
          <Label>provider</Label>
          <Seg<ProviderKind>
            options={PROVIDERS}
            value={config.provider}
            onChange={setProvider}
            accent={accent}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <Label>base url</Label>
          <Input
            mono
            value={config.baseUrl}
            placeholder={defaultBaseUrl(config.provider)}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <Label>api key</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            <Input
              mono
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="sk-… (empty = local)"
              autoComplete="off"
              spellCheck={false}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Btn onClick={() => setShowKey(!showKey)}>{showKey ? 'hide' : 'show'}</Btn>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <Label>model</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            {models ? (
              <select
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'var(--c-bg)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text)',
                  borderRadius: 5,
                  padding: '5px 9px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-sm)',
                  height: 26,
                }}
              >
                <option value="">— select —</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <Input
                mono
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder="model id"
                style={{ flex: 1, minWidth: 0 }}
              />
            )}
            <Btn onClick={detect} disabled={loading} title="Auto-detect: GET /models">
              {loading ? '…' : 'detect'}
            </Btn>
            {models && <Btn onClick={() => setModels(null)} title="Manual entry">manual</Btn>}
          </div>
        </div>
        <div
          style={{
            // In 2-col grid layout the extra label spans both cols so the
            // long placeholder text doesn't get squeezed.
            gridColumn: layout === 'row' ? 'auto' : 'span 2',
            minWidth: 0,
          }}
        >
          <Label>extra label</Label>
          <Input
            mono
            value={config.extra ?? ''}
            onChange={(e) => patch({ extra: e.target.value })}
            placeholder="e.g. dflash, mtp, GPU-67, fp8…"
            style={{ width: '100%' }}
          />
        </div>
        {error && (
          <div
            style={{
              gridColumn: '1 / -1',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--c-error)',
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
