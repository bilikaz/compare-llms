import { useState } from 'react';
import type { ModelConfig, ProviderKind } from '../types';
import { listModels, defaultBaseUrl } from '../providers';

interface Props {
  config: ModelConfig;
  onChange: (cfg: ModelConfig) => void;
  accent: string;
}

export function ModelConfigCard({ config, onChange, accent }: Props) {
  const [models, setModels] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function setProvider(p: ProviderKind) {
    onChange({ ...config, provider: p, baseUrl: defaultBaseUrl(p) });
    setModels(null);
  }

  return (
    <div className="border rounded-md p-3 flex flex-col gap-2" style={{ borderColor: '#222' }}>
      <div className="flex items-center gap-2">
        <button
          className="text-neutral-400 hover:text-neutral-200 text-sm w-5"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'expand' : 'collapse'}
        >{collapsed ? '▸' : '▾'}</button>
        <span style={{ color: accent }} className="font-bold text-lg">{config.label}</span>
        <input
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm flex-1"
          value={config.label}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="display label"
        />
      </div>

      {!collapsed && (
        <>
          <div className="flex gap-2 text-xs">
            {(['openai', 'anthropic', 'gemini'] as ProviderKind[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-2 py-1 rounded border ${config.provider === p ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-900 border-neutral-800'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <label className="text-xs text-neutral-400">Base URL</label>
          <input
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs"
            value={config.baseUrl}
            placeholder={defaultBaseUrl(config.provider)}
            onChange={(e) => patch({ baseUrl: e.target.value })}
          />

          <label className="text-xs text-neutral-400">API Key</label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs flex-1"
              value={config.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="sk-… (leave empty for local servers)"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-2 py-1 text-xs"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'hide' : 'show'}
            >{showKey ? 'hide' : 'show'}</button>
          </div>

          <label className="text-xs text-neutral-400">Model</label>
          <div className="flex gap-2">
            {models ? (
              <select
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs flex-1"
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
              >
                <option value="">— select —</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs flex-1"
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder="model id"
              />
            )}
            <button
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-2 py-1 text-xs disabled:opacity-50"
              onClick={detect}
              disabled={loading}
              title="Auto-detect: GET /models"
            >
              {loading ? '…' : 'auto-detect'}
            </button>
            {models && (
              <button
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-2 py-1 text-xs"
                onClick={() => setModels(null)}
                title="Manual entry"
              >
                manual
              </button>
            )}
          </div>

          <label className="text-xs text-neutral-400">Extra <span className="text-neutral-600">— shown in brackets after the model name</span></label>
          <input
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs"
            value={config.extra ?? ''}
            onChange={(e) => patch({ extra: e.target.value })}
            placeholder="e.g. dflash, mtp, GPU-67, fp8…"
          />

          {error && <div className="text-xs text-red-400 break-all">{error}</div>}
        </>
      )}
    </div>
  );
}
